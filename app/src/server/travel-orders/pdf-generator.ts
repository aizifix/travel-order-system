import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { PrintableTravelOrderData } from "@/src/server/travel-orders/print-service";

const execFileAsync = promisify(execFile);

type Objective = Readonly<{
  text: string;
}>;

type Trip = Readonly<{
  departureDate: string;
  returnDate: string;
  specificDestination: string;
  specificPurpose: string;
}>;

type TemplateData = Readonly<{
  date: string;
  toNumber: string;
  mainTraveler: string;
  empStatus: string;
  travelerPosition: string;
  travelerDesignation: string;
  division: string;
  unitOfPlace: string;
  transportation: string;
  fundingSource: string;
  remarks: string;
  approver: string;
  approverPosition: string;
  defaultApprover: string;
  defaultApproverPosition: string;
  otherStaffNames: string;
  otherStaffPositions: string;
  departureDate: string;
  returnDate: string;
  specificDestination: string;
  specificPurpose: string;
  objectives: readonly Objective[];
  trips: readonly Trip[];
}>;

type GenerateTravelOrderPdfResult = Readonly<{
  pdfBuffer: Buffer;
  fileName: string;
}>;

let templateBufferPromise: Promise<Buffer> | null = null;
let sofficePathPromise: Promise<string | null> | null = null;

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function formatDateForTemplate(isoDate: string): string {
  if (!isoDate) {
    return "";
  }

  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return `${months[date.getUTCMonth()]}-${String(date.getUTCDate()).padStart(2, "0")}-${date.getUTCFullYear()}`;
}

function sanitizeFileName(orderNo: string): string {
  const safeOrderNo = orderNo.replace(/[^A-Za-z0-9._-]/g, "_");
  return `travel_order_${safeOrderNo || "output"}.pdf`;
}

function buildObjectives(purpose: string): readonly Objective[] {
  const entries = purpose
    .split(/\r?\n+/)
    .map((line) => normalizeText(line))
    .filter((line) => line.length > 0)
    .map((text) => ({ text }));

  if (entries.length > 0) {
    return entries;
  }

  return [{ text: "Official travel requirement." }];
}

function parseMultilineLines(value: string): readonly string[] {
  return value
    .split(/\r?\n+/)
    .map((line) => normalizeText(line))
    .filter((line) => line.length > 0);
}

function formatDateByOffset(isoDate: string, offsetDays: number): string {
  if (!isoDate) {
    return "";
  }

  const base = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) {
    return "";
  }

  const shifted = new Date(base.getTime() + offsetDays * 86_400_000);
  const shiftedIso = shifted.toISOString().slice(0, 10);
  return formatDateForTemplate(shiftedIso);
}

function withTripLabel(value: string, tripOrder: number): string {
  const normalizedValue = normalizeText(value);
  const label = `Trip ${tripOrder}`;
  return normalizedValue ? `${label}: ${normalizedValue}` : label;
}

function buildTrips(order: PrintableTravelOrderData): readonly Trip[] {
  if (order.trips.length > 0) {
    const orderedTrips = [...order.trips].sort((leftTrip, rightTrip) => {
      if (leftTrip.tripOrder !== rightTrip.tripOrder) {
        return leftTrip.tripOrder - rightTrip.tripOrder;
      }

      if (leftTrip.departureDateIso !== rightTrip.departureDateIso) {
        return leftTrip.departureDateIso.localeCompare(rightTrip.departureDateIso);
      }

      return leftTrip.id - rightTrip.id;
    });
    const hasMultipleTrips = orderedTrips.length > 1;
    const fallbackDepartureDate = formatDateForTemplate(order.departureDateIso);
    const fallbackReturnDate = formatDateForTemplate(order.returnDateIso);

    return orderedTrips.map((trip, index) => {
      const normalizedTripOrder = Number.isFinite(trip.tripOrder)
        ? Math.max(1, Math.trunc(trip.tripOrder))
        : index + 1;
      const destination = normalizeText(trip.specificDestination);
      const purpose = normalizeText(trip.specificPurpose);
      const departureDate =
        formatDateForTemplate(trip.departureDateIso) || fallbackDepartureDate;
      const returnDate = formatDateForTemplate(trip.returnDateIso) || fallbackReturnDate;

      return {
        departureDate,
        returnDate,
        specificDestination: hasMultipleTrips
          ? withTripLabel(destination, normalizedTripOrder)
          : destination,
        specificPurpose: purpose,
      };
    });
  }

  const fallbackDestination = normalizeText(order.destination);
  const fallbackPurpose = normalizeText(order.purpose);
  const destinationLines = parseMultilineLines(order.destination);
  const purposeLines = parseMultilineLines(order.purpose);
  const departureDate = formatDateForTemplate(order.departureDateIso);
  const returnDate = formatDateForTemplate(order.returnDateIso);
  const travelDays = Math.max(1, order.travelDays);
  const hasStackedInput = destinationLines.length > 1 || purposeLines.length > 1;

  // If there is no multi-line daily input, keep the row consolidated
  // (departure -> return) to avoid confusing duplicated daily rows.
  if (!hasStackedInput) {
    return [
      {
        departureDate,
        returnDate,
        specificDestination: destinationLines[0] ?? fallbackDestination,
        specificPurpose: purposeLines[0] ?? fallbackPurpose,
      },
    ];
  }

  // Stack rows when the destination/purpose inputs have multi-line daily entries.
  const rowCount = Math.max(travelDays, destinationLines.length, purposeLines.length);
  return Array.from({ length: rowCount }, (_, index) => {
    const boundedOffset = Math.min(index, travelDays - 1);
    const dayDate = formatDateByOffset(order.departureDateIso, boundedOffset);

    return {
      departureDate: dayDate || departureDate,
      returnDate: dayDate || returnDate,
      specificDestination:
        destinationLines[index] ?? destinationLines[0] ?? fallbackDestination,
      specificPurpose: purposeLines[index] ?? purposeLines[0] ?? fallbackPurpose,
    };
  });
}

function mapTemplateData(order: PrintableTravelOrderData): TemplateData {
  const otherStaffNames = order.otherStaff
    .map((staff) => normalizeText(staff.name))
    .filter(Boolean)
    .join(", ");

  const otherStaffPositions = order.otherStaff
    .map((staff) => normalizeText(staff.position || staff.division))
    .filter(Boolean)
    .join(", ");
  const trips = buildTrips(order);
  const firstTrip = trips[0] ?? {
    departureDate: "",
    returnDate: "",
    specificDestination: "",
    specificPurpose: "",
  };

  return {
    date: formatDateForTemplate(order.orderDateIso),
    toNumber: order.orderNo,
    mainTraveler: normalizeText(order.requesterName),
    empStatus: normalizeText(order.employmentStatus),
    travelerPosition: normalizeText(order.requesterPosition),
    travelerDesignation: normalizeText(order.requesterDesignation),
    division: normalizeText(order.division),
    unitOfPlace: normalizeText(order.unitOfPlace || order.division),
    transportation: normalizeText(order.transportation),
    fundingSource: normalizeText(order.fundingSource),
    remarks: normalizeText(order.remarks),
    approver: normalizeText(order.recommendingApproverName),
    approverPosition: normalizeText(order.recommendingApproverPosition),
    defaultApprover: normalizeText(order.finalApproverName),
    defaultApproverPosition: normalizeText(order.finalApproverPosition),
    otherStaffNames,
    otherStaffPositions,
    // Backward-compatible placeholders for single-row templates.
    departureDate: firstTrip.departureDate,
    returnDate: firstTrip.returnDate,
    specificDestination: firstTrip.specificDestination,
    specificPurpose: firstTrip.specificPurpose,
    objectives: buildObjectives(order.purpose),
    // Stackable placeholder for row loops in Docxtemplater tables.
    trips,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveTemplatePath(): Promise<string> {
  const candidates = [
    path.join(process.cwd(), "templates", "travel_order_template.docx"),
    path.join(process.cwd(), "templates", "travel-order-template.docx"),
    path.join(process.cwd(), "public", "templates", "travel_order_template.docx"),
    path.join(process.cwd(), "public", "templates", "travel-order-template.docx"),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Template file not found. Checked: ${candidates.join(", ")}`,
  );
}

async function getTemplateBuffer(): Promise<Buffer> {
  if (!templateBufferPromise) {
    templateBufferPromise = resolveTemplatePath().then((templatePath) =>
      fs.readFile(templatePath),
    );
  }

  return templateBufferPromise;
}

async function findSofficePath(): Promise<string | null> {
  const envPath = process.env.LIBREOFFICE_PATH ?? process.env.SOFFICE_PATH;
  const candidates = [
    envPath,
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/usr/bin/soffice",
    "/usr/local/bin/soffice",
    "/snap/bin/libreoffice",
    "/usr/lib/libreoffice/program/soffice",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  try {
    const lookupCommand = process.platform === "win32" ? "where" : "which";
    const { stdout } = await execFileAsync(lookupCommand, ["soffice"], {
      windowsHide: true,
    });
    const resolved = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    return resolved || null;
  } catch {
    return null;
  }
}

async function getSofficePath(): Promise<string | null> {
  if (!sofficePathPromise) {
    sofficePathPromise = findSofficePath();
  }

  return sofficePathPromise;
}

async function convertDocxToPdfWithWindowsCom(
  docxPath: string,
  pdfPath: string,
): Promise<void> {
  const script = `
$ErrorActionPreference = 'Stop'
$inputPath = $env:PRINT_PDF_INPUT_PATH
$outputPath = $env:PRINT_PDF_OUTPUT_PATH
$progIds = @('Word.Application', 'KWPS.Application', 'WPS.Application')

function Invoke-ComWithRetry {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Action,
    [int]$MaxRetries = 12,
    [int]$BaseDelayMs = 250
  )

  for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
    try {
      return & $Action
    } catch [System.Runtime.InteropServices.COMException] {
      $hresult = $_.Exception.HResult
      $message = $_.Exception.Message
      $isBusy =
        $hresult -eq -2147418111 -or
        $hresult -eq -2147417846 -or
        $message -match 'rejected by callee'

      if (-not $isBusy -or $attempt -eq $MaxRetries) {
        throw
      }

      Start-Sleep -Milliseconds ($BaseDelayMs * $attempt)
    }
  }
}

$app = $null
$doc = $null
try {
  foreach ($progId in $progIds) {
    try {
      $app = New-Object -ComObject $progId
      break
    } catch {
      continue
    }
  }

  if (-not $app) {
    throw 'No supported Office COM application found (WPS Office or Microsoft Word).'
  }

  $app.Visible = $false
  try { $app.DisplayAlerts = 0 } catch {}

  $doc = Invoke-ComWithRetry { $app.Documents.Open($inputPath, $false, $true) }

  try {
    Invoke-ComWithRetry { $doc.ExportAsFixedFormat($outputPath, 17) } | Out-Null
  } catch {
    if ($doc.PSObject.Methods.Name -contains 'SaveAs2') {
      Invoke-ComWithRetry { $doc.SaveAs2($outputPath, 17) } | Out-Null
    } else {
      Invoke-ComWithRetry { $doc.SaveAs($outputPath, 17) } | Out-Null
    }
  }

  if (-not (Test-Path $outputPath)) {
    throw 'PDF was not created.'
  }
} finally {
  if ($doc) {
    try { Invoke-ComWithRetry { $doc.Close($false) } | Out-Null } catch {}
    try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc) } catch {}
  }

  if ($app) {
    try { Invoke-ComWithRetry { $app.Quit() } | Out-Null } catch {}
    try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($app) } catch {}
  }

  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
`.trim();

  try {
    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Sta",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
      ],
      {
        env: {
          ...process.env,
          PRINT_PDF_INPUT_PATH: docxPath,
          PRINT_PDF_OUTPUT_PATH: pdfPath,
        },
        windowsHide: true,
        timeout: 120_000,
        maxBuffer: 20 * 1024 * 1024,
      },
    );
  } catch (error: unknown) {
    const powershellStderr =
      typeof error === "object" && error !== null && "stderr" in error
        ? String((error as { stderr?: unknown }).stderr ?? "")
        : "";
    const powershellStdout =
      typeof error === "object" && error !== null && "stdout" in error
        ? String((error as { stdout?: unknown }).stdout ?? "")
        : "";
    const fallbackMessage =
      error instanceof Error ? error.message : "Unknown PowerShell COM error.";

    throw new Error(
      `WPS/Word COM conversion failed. ${powershellStderr || powershellStdout || fallbackMessage}`.trim(),
    );
  }

  if (!(await fileExists(pdfPath))) {
    throw new Error("WPS/Word COM conversion did not produce a PDF file.");
  }
}

async function convertDocxBufferToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "travel-order-pdf-"));
  const docxPath = path.join(tempDir, "input.docx");
  const pdfPath = path.join(tempDir, "input.pdf");

  await fs.writeFile(docxPath, docxBuffer);

  try {
    const sofficePath = await getSofficePath();

    if (sofficePath) {
      const { stderr } = await execFileAsync(
        sofficePath,
        [
          "--headless",
          "--nologo",
          "--nofirststartwizard",
          "--convert-to",
          "pdf:writer_pdf_Export",
          "--outdir",
          tempDir,
          docxPath,
        ],
        {
          windowsHide: true,
          timeout: 120_000,
          maxBuffer: 20 * 1024 * 1024,
        },
      );

      if (!(await fileExists(pdfPath))) {
        throw new Error(
          `LibreOffice did not produce a PDF file.${stderr ? ` ${stderr}` : ""}`,
        );
      }
    } else if (process.platform === "win32") {
      await convertDocxToPdfWithWindowsCom(docxPath, pdfPath);
    } else {
      throw new Error(
        "No PDF converter found. Install LibreOffice (soffice), or on Windows use WPS Office / Microsoft Word (COM).",
      );
    }

    return fs.readFile(pdfPath);
  } finally {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        break;
      } catch (error: unknown) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code?: unknown }).code ?? "")
            : "";
        const retryable = code === "EBUSY" || code === "EPERM" || code === "ENOTEMPTY";

        if (!retryable || attempt === 7) {
          break;
        }
      }
    }
  }
}

export async function generateTravelOrderPdf(
  order: PrintableTravelOrderData,
): Promise<GenerateTravelOrderPdfResult> {
  const templateData = mapTemplateData(order);
  const templateBuffer = await getTemplateBuffer();

  // Load heavy docx modules only inside the print flow.
  const [{ default: Docxtemplater }, { default: PizZip }] = await Promise.all([
    import("docxtemplater"),
    import("pizzip"),
  ]);

  const zip = new PizZip(templateBuffer.toString("binary"));
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(templateData);

  const filledDocxBuffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;

  const pdfBuffer = await convertDocxBufferToPdf(filledDocxBuffer);
  const fileName = sanitizeFileName(order.orderNo);

  return {
    pdfBuffer,
    fileName,
  };
}
