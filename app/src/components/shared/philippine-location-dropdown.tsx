"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDown, Check, Search, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";

export type LocationOption = {
  code: string;
  name: string;
};

export type ProvinceOption = LocationOption & {
  regionCode: string;
};

export type CityMunicipalityOption = LocationOption & {
  provinceCode: string;
  isCity: boolean;
};

export type BarangayOption = LocationOption & {
  cityMunicipalityCode: string;
};

export type LocationValues = {
  region: LocationOption | null;
  province: ProvinceOption | null;
  cityMunicipality: CityMunicipalityOption | null;
  barangay: BarangayOption | null;
};

export type PhilippineLocationDropdownProps = {
  name: string;
  label?: string;
  disabled?: boolean;
  defaultValues?: {
    regionCode?: string;
    provinceCode?: string;
    cityMunicipalityCode?: string;
    barangayCode?: string;
  };
  onChange?: (values: {
    values: LocationValues;
    fullAddress: string;
  }) => void;
  includeManualInput?: boolean;
  manualInputPlaceholder?: string;
};

type LoadingState = "idle" | "loading" | "ready" | "error";

type DropdownState = {
  isOpen: boolean;
  search: string;
  selectedCode: string;
};

function createInitialDropdownState(): DropdownState {
  return {
    isOpen: false,
    search: "",
    selectedCode: "",
  };
}

export function PhilippineLocationDropdown({
  name,
  label = "Destination",
  disabled = false,
  defaultValues,
  onChange,
  includeManualInput = true,
  manualInputPlaceholder = "Enter destination manually",
}: PhilippineLocationDropdownProps) {
  const [regions, setRegions] = useState<LocationOption[]>([]);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState<CityMunicipalityOption[]>([]);
  const [barangays, setBarangays] = useState<BarangayOption[]>([]);

  const [regionsState, setRegionsState] = useState<LoadingState>("idle");
  const [provincesState, setProvincesState] = useState<LoadingState>("idle");
  const [citiesMunicipalitiesState, setCitiesMunicipalitiesState] = useState<LoadingState>("idle");
  const [barangaysState, setBarangaysState] = useState<LoadingState>("idle");

  const [regionsError, setRegionsError] = useState<string | null>(null);
  const [provincesError, setProvincesError] = useState<string | null>(null);
  const [citiesMunicipalitiesError, setCitiesMunicipalitiesError] = useState<string | null>(null);
  const [barangaysError, setBarangaysError] = useState<string | null>(null);

  const [regionDropdown, setRegionDropdown] = useState<DropdownState>(createInitialDropdownState());
  const [provinceDropdown, setProvinceDropdown] = useState<DropdownState>(createInitialDropdownState());
  const [cityMunicipalityDropdown, setCityMunicipalityDropdown] = useState<DropdownState>(createInitialDropdownState());
  const [barangayDropdown, setBarangayDropdown] = useState<DropdownState>(createInitialDropdownState());

  const [values, setValues] = useState<LocationValues>({
    region: null,
    province: null,
    cityMunicipality: null,
    barangay: null,
  });

  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const regionContainerRef = useRef<HTMLDivElement>(null);
  const provinceContainerRef = useRef<HTMLDivElement>(null);
  const cityMunicipalityContainerRef = useRef<HTMLDivElement>(null);
  const barangayContainerRef = useRef<HTMLDivElement>(null);

  // Load regions on mount
  useEffect(() => {
    if (regionsState === "loading" || regionsState === "ready") {
      return;
    }

    const loadRegions = async () => {
      try {
        setRegionsState("loading");
        setRegionsError(null);

        const response = await fetch("/api/philippine-locations?action=regions");
        if (!response.ok) {
          throw new Error(`Failed to load regions: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to load regions");
        }

        setRegions(result.data);
        setRegionsState("ready");

        // Restore default region if provided
        if (defaultValues?.regionCode) {
          const defaultRegion = result.data.find(
            (r: LocationOption) => r.code === defaultValues.regionCode,
          );
          if (defaultRegion) {
            handleRegionSelect(defaultRegion);
          }
        }
      } catch (error) {
        console.error("Failed to load regions:", error);
        setRegionsState("error");
        setRegionsError(error instanceof Error ? error.message : "Failed to load regions");
      }
    };

    void loadRegions();
  }, []);

  // Load provinces when region is selected
  useEffect(() => {
    if (!values.region || provincesState === "ready") {
      return;
    }

    const loadProvinces = async () => {
      try {
        setProvincesState("loading");
        setProvincesError(null);

        const response = await fetch(
          `/api/philippine-locations?action=provinces&regionCode=${values.region?.code}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load provinces: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to load provinces");
        }

        setProvinces(result.data);
        setProvincesState("ready");

        // Restore default province if provided
        if (defaultValues?.provinceCode) {
          const defaultProvince = result.data.find(
            (p: ProvinceOption) => p.code === defaultValues.provinceCode,
          );
          if (defaultProvince) {
            handleProvinceSelect(defaultProvince);
          }
        }
      } catch (error) {
        console.error("Failed to load provinces:", error);
        setProvincesState("error");
        setProvincesError(error instanceof Error ? error.message : "Failed to load provinces");
      }
    };

    void loadProvinces();
  }, [values.region?.code]);

  // Load cities/municipalities when province is selected
  useEffect(() => {
    if (!values.province || citiesMunicipalitiesState === "ready") {
      return;
    }

    const loadCitiesMunicipalities = async () => {
      try {
        setCitiesMunicipalitiesState("loading");
        setCitiesMunicipalitiesError(null);

        const response = await fetch(
          `/api/philippine-locations?action=cities-municipalities&provinceCode=${values.province?.code}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load cities/municipalities: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to load cities/municipalities");
        }

        setCitiesMunicipalities(result.data);
        setCitiesMunicipalitiesState("ready");

        // Restore default city/municipality if provided
        if (defaultValues?.cityMunicipalityCode) {
          const defaultCityMunicipality = result.data.find(
            (c: CityMunicipalityOption) => c.code === defaultValues.cityMunicipalityCode,
          );
          if (defaultCityMunicipality) {
            handleCityMunicipalitySelect(defaultCityMunicipality);
          }
        }
      } catch (error) {
        console.error("Failed to load cities/municipalities:", error);
        setCitiesMunicipalitiesState("error");
        setCitiesMunicipalitiesError(error instanceof Error ? error.message : "Failed to load cities/municipalities");
      }
    };

    void loadCitiesMunicipalities();
  }, [values.province?.code]);

  // Load barangays when city/municipality is selected
  useEffect(() => {
    if (!values.cityMunicipality || barangaysState === "ready") {
      return;
    }

    const loadBarangays = async () => {
      try {
        setBarangaysState("loading");
        setBarangaysError(null);

        const response = await fetch(
          `/api/philippine-locations?action=barangays&cityMunicipalityCode=${values.cityMunicipality?.code}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load barangays: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to load barangays");
        }

        setBarangays(result.data);
        setBarangaysState("ready");

        // Restore default barangay if provided
        if (defaultValues?.barangayCode) {
          const defaultBarangay = result.data.find(
            (b: BarangayOption) => b.code === defaultValues.barangayCode,
          );
          if (defaultBarangay) {
            handleBarangaySelect(defaultBarangay);
          }
        }
      } catch (error) {
        console.error("Failed to load barangays:", error);
        setBarangaysState("error");
        setBarangaysError(error instanceof Error ? error.message : "Failed to load barangays");
      }
    };

    void loadBarangays();
  }, [values.cityMunicipality?.code]);

  // Notify parent of changes
  useEffect(() => {
    if (!onChange) {
      return;
    }

    const fullAddress = buildFullAddress(values);
    onChange({
      values,
      fullAddress,
    });
  }, [values]);

  const buildFullAddress = useCallback((locValues: LocationValues): string => {
    const parts: string[] = [];

    if (locValues.barangay) {
      parts.push(locValues.barangay.name);
    }
    if (locValues.cityMunicipality) {
      parts.push(locValues.cityMunicipality.name);
    }
    if (locValues.province) {
      parts.push(locValues.province.name);
    }
    if (locValues.region) {
      parts.push(locValues.region.name);
    }

    return parts.join(", ");
  }, []);

  const handleRegionSelect = (region: LocationOption) => {
    setValues((prev) => ({
      region,
      province: null,
      cityMunicipality: null,
      barangay: null,
    }));
    setProvinces([]);
    setCitiesMunicipalities([]);
    setBarangays([]);
    setProvincesState("idle");
    setCitiesMunicipalitiesState("idle");
    setBarangaysState("idle");
    setProvinceDropdown(createInitialDropdownState());
    setCityMunicipalityDropdown(createInitialDropdownState());
    setBarangayDropdown(createInitialDropdownState());
    setRegionDropdown((prev) => ({ ...prev, isOpen: false, search: "", selectedCode: region.code }));
  };

  const handleProvinceSelect = (province: ProvinceOption) => {
    setValues((prev) => ({
      ...prev,
      province,
      cityMunicipality: null,
      barangay: null,
    }));
    setCitiesMunicipalities([]);
    setBarangays([]);
    setCitiesMunicipalitiesState("idle");
    setBarangaysState("idle");
    setCityMunicipalityDropdown(createInitialDropdownState());
    setBarangayDropdown(createInitialDropdownState());
    setProvinceDropdown((prev) => ({ ...prev, isOpen: false, search: "", selectedCode: province.code }));
  };

  const handleCityMunicipalitySelect = (cityMunicipality: CityMunicipalityOption) => {
    setValues((prev) => ({
      ...prev,
      cityMunicipality,
      barangay: null,
    }));
    setBarangays([]);
    setBarangaysState("idle");
    setBarangayDropdown(createInitialDropdownState());
    setCityMunicipalityDropdown((prev) => ({ ...prev, isOpen: false, search: "", selectedCode: cityMunicipality.code }));
  };

  const handleBarangaySelect = (barangay: BarangayOption) => {
    setValues((prev) => ({
      ...prev,
      barangay,
    }));
    setBarangayDropdown((prev) => ({ ...prev, isOpen: false, search: "", selectedCode: barangay.code }));
  };

  const handleClear = (level: "region" | "province" | "cityMunicipality" | "barangay") => {
    if (level === "region") {
      setValues({ region: null, province: null, cityMunicipality: null, barangay: null });
      setRegions([]);
      setProvinces([]);
      setCitiesMunicipalities([]);
      setBarangays([]);
      setRegionsState("idle");
      setProvincesState("idle");
      setCitiesMunicipalitiesState("idle");
      setBarangaysState("idle");
      setRegionDropdown(createInitialDropdownState());
      setProvinceDropdown(createInitialDropdownState());
      setCityMunicipalityDropdown(createInitialDropdownState());
      setBarangayDropdown(createInitialDropdownState());
    } else if (level === "province") {
      setValues((prev) => ({ ...prev, province: null, cityMunicipality: null, barangay: null }));
      setCitiesMunicipalities([]);
      setBarangays([]);
      setCitiesMunicipalitiesState("idle");
      setBarangaysState("idle");
      setProvinceDropdown(createInitialDropdownState());
      setCityMunicipalityDropdown(createInitialDropdownState());
      setBarangayDropdown(createInitialDropdownState());
    } else if (level === "cityMunicipality") {
      setValues((prev) => ({ ...prev, cityMunicipality: null, barangay: null }));
      setBarangays([]);
      setBarangaysState("idle");
      setCityMunicipalityDropdown(createInitialDropdownState());
      setBarangayDropdown(createInitialDropdownState());
    } else {
      setValues((prev) => ({ ...prev, barangay: null }));
      setBarangayDropdown(createInitialDropdownState());
    }
  };

  const handleRetry = (level: "regions" | "provinces" | "citiesMunicipalities" | "barangays") => {
    if (level === "regions") {
      setRegionsState("loading");
      setRegionsError(null);
      void (async () => {
        try {
          const response = await fetch("/api/philippine-locations?action=regions");
          const result = await response.json();
          if (!result.success) throw new Error(result.error);
          setRegions(result.data);
          setRegionsState("ready");
        } catch (error) {
          setRegionsState("error");
          setRegionsError(error instanceof Error ? error.message : "Failed to load regions");
        }
      })();
    } else if (level === "provinces" && values.region) {
      setProvincesState("loading");
      setProvincesError(null);
      const regionCode = values.region.code;
      void (async () => {
        try {
          const response = await fetch(`/api/philippine-locations?action=provinces&regionCode=${regionCode}`);
          const result = await response.json();
          if (!result.success) throw new Error(result.error);
          setProvinces(result.data);
          setProvincesState("ready");
        } catch (error) {
          setProvincesState("error");
          setProvincesError(error instanceof Error ? error.message : "Failed to load provinces");
        }
      })();
    } else if (level === "citiesMunicipalities" && values.province) {
      setCitiesMunicipalitiesState("loading");
      setCitiesMunicipalitiesError(null);
      const provinceCode = values.province.code;
      void (async () => {
        try {
          const response = await fetch(`/api/philippine-locations?action=cities-municipalities&provinceCode=${provinceCode}`);
          const result = await response.json();
          if (!result.success) throw new Error(result.error);
          setCitiesMunicipalities(result.data);
          setCitiesMunicipalitiesState("ready");
        } catch (error) {
          setCitiesMunicipalitiesState("error");
          setCitiesMunicipalitiesError(error instanceof Error ? error.message : "Failed to load cities/municipalities");
        }
      })();
    } else if (level === "barangays" && values.cityMunicipality) {
      setBarangaysState("loading");
      setBarangaysError(null);
      const cityMunicipalityCode = values.cityMunicipality.code;
      void (async () => {
        try {
          const response = await fetch(`/api/philippine-locations?action=barangays&cityMunicipalityCode=${cityMunicipalityCode}`);
          const result = await response.json();
          if (!result.success) throw new Error(result.error);
          setBarangays(result.data);
          setBarangaysState("ready");
        } catch (error) {
          setBarangaysState("error");
          setBarangaysError(error instanceof Error ? error.message : "Failed to load barangays");
        }
      })();
    }
  };

  const toggleManualMode = () => {
    setManualMode(!manualMode);
    if (!manualMode) {
      setValues({ region: null, province: null, cityMunicipality: null, barangay: null });
    }
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [
        regionContainerRef,
        provinceContainerRef,
        cityMunicipalityContainerRef,
        barangayContainerRef,
      ];

      refs.forEach((ref, index) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          const dropdowns = [regionDropdown, provinceDropdown, cityMunicipalityDropdown, barangayDropdown];
          const setDropdowns = [setRegionDropdown, setProvinceDropdown, setCityMunicipalityDropdown, setBarangayDropdown];
          if (dropdowns[index].isOpen) {
            setDropdowns[index]((prev) => ({ ...prev, isOpen: false, search: "" }));
          }
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [regionDropdown.isOpen, provinceDropdown.isOpen, cityMunicipalityDropdown.isOpen, barangayDropdown.isOpen]);

  const getFilteredOptions = (options: LocationOption[], search: string) => {
    if (!search) return options;
    return options.filter((option) =>
      option.name.toLowerCase().includes(search.toLowerCase()),
    );
  };

  const isProvinceDisabled = !values.region || disabled;
  const isCityMunicipalityDisabled = !values.province || disabled;
  const isBarangayDisabled = !values.cityMunicipality || disabled;

  const regionDisplayText = values.region?.name || "- Select Region -";
  const provinceDisplayText = values.province?.name || "- Select Province -";
  const cityMunicipalityDisplayText = values.cityMunicipality?.name || "- Select City/Municipality -";
  const barangayDisplayText = values.barangay?.name || "- Select Barangay (Optional) -";

  const filteredRegions = getFilteredOptions(regions, regionDropdown.search);
  const filteredProvinces = getFilteredOptions(provinces, provinceDropdown.search);
  const filteredCitiesMunicipalities = getFilteredOptions(citiesMunicipalities, cityMunicipalityDropdown.search);
  const filteredBarangays = getFilteredOptions(barangays, barangayDropdown.search);

  if (manualMode) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#4a5266]">
          {label}
        </label>
        <input
          type="text"
          name={name}
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          disabled={disabled}
          placeholder={manualInputPlaceholder}
          className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] outline-none focus:border-[#3B9F41] focus:ring-1 focus:ring-[#3B9F41] disabled:cursor-not-allowed disabled:bg-[#f8f9fc] disabled:text-[#8b92a7]"
        />
        <button
          type="button"
          onClick={toggleManualMode}
          disabled={disabled}
          className="mt-2 text-xs font-semibold text-[#5d6780] transition hover:text-[#3B9F41] disabled:opacity-60"
        >
          Switch to location picker
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#4a5266]">
          {label}
        </label>
        {includeManualInput && (
          <button
            type="button"
            onClick={toggleManualMode}
            disabled={disabled}
            className="text-xs font-semibold text-[#5d6780] transition hover:text-[#3B9F41] disabled:opacity-60"
          >
            Enter manually
          </button>
        )}
      </div>

      {/* Region Dropdown */}
      <div ref={regionContainerRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setRegionDropdown((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
          disabled={disabled || regionsState === "error"}
          className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-sm transition-all duration-200
            ${regionDropdown.isOpen
              ? "border-[#3B9F41] ring-1 ring-[#3B9F41]"
              : "border-[#dfe1ed] hover:border-[#b8bcc9]"
            }
            ${disabled ? "cursor-not-allowed bg-[#f8f9fc] text-[#8b92a7]" : "text-[#2f3339]"}
          `}
        >
          <span className="truncate">{regionDisplayText}</span>
          <div className="flex items-center gap-1">
            {regionsState === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin text-[#6b7280]" />
            )}
            {regionsState === "error" && (
              <AlertCircle className="h-4 w-4 text-[#c85050]" />
            )}
            {values.region && !disabled && (
              <X
                className="h-3.5 w-3.5 text-[#9ca3af] hover:text-[#6b7280]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear("region");
                }}
              />
            )}
            <ChevronDown
              className={`h-4 w-4 text-[#6b7280] transition-transform duration-200 ${
                regionDropdown.isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
        <input type="hidden" name={`${name}_region`} value={values.region?.code || ""} />

        {regionDropdown.isOpen && (
          <DropdownContent
            options={filteredRegions}
            search={regionDropdown.search}
            setSearch={(search) => setRegionDropdown((prev) => ({ ...prev, search }))}
            selectedCode={values.region?.code || ""}
            onSelect={(code) => {
              const region = regions.find((r) => r.code === code);
              if (region) handleRegionSelect(region);
            }}
            loadingState={regionsState}
            error={regionsError}
            onRetry={() => handleRetry("regions")}
            placeholder="Search regions..."
          />
        )}
      </div>

      {/* Province Dropdown */}
      <div ref={provinceContainerRef} className="relative">
        <button
          type="button"
          onClick={() => !isProvinceDisabled && setProvinceDropdown((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
          disabled={isProvinceDisabled || provincesState === "error"}
          className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-sm transition-all duration-200
            ${provinceDropdown.isOpen
              ? "border-[#3B9F41] ring-1 ring-[#3B9F41]"
              : "border-[#dfe1ed] hover:border-[#b8bcc9]"
            }
            ${isProvinceDisabled ? "cursor-not-allowed bg-[#f8f9fc] text-[#8b92a7]" : "text-[#2f3339]"}
          `}
        >
          <span className="truncate">{provinceDisplayText}</span>
          <div className="flex items-center gap-1">
            {provincesState === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin text-[#6b7280]" />
            )}
            {provincesState === "error" && (
              <AlertCircle className="h-4 w-4 text-[#c85050]" />
            )}
            {values.province && !isProvinceDisabled && (
              <X
                className="h-3.5 w-3.5 text-[#9ca3af] hover:text-[#6b7280]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear("province");
                }}
              />
            )}
            <ChevronDown
              className={`h-4 w-4 text-[#6b7280] transition-transform duration-200 ${
                provinceDropdown.isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
        <input type="hidden" name={`${name}_province`} value={values.province?.code || ""} />

        {provinceDropdown.isOpen && (
          <DropdownContent
            options={filteredProvinces}
            search={provinceDropdown.search}
            setSearch={(search) => setProvinceDropdown((prev) => ({ ...prev, search }))}
            selectedCode={values.province?.code || ""}
            onSelect={(code) => {
              const province = provinces.find((p) => p.code === code);
              if (province) handleProvinceSelect(province);
            }}
            loadingState={provincesState}
            error={provincesError}
            onRetry={() => handleRetry("provinces")}
            placeholder="Search provinces..."
            disabled={!values.region}
          />
        )}
      </div>

      {/* City/Municipality Dropdown */}
      <div ref={cityMunicipalityContainerRef} className="relative">
        <button
          type="button"
          onClick={() => !isCityMunicipalityDisabled && setCityMunicipalityDropdown((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
          disabled={isCityMunicipalityDisabled || citiesMunicipalitiesState === "error"}
          className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-sm transition-all duration-200
            ${cityMunicipalityDropdown.isOpen
              ? "border-[#3B9F41] ring-1 ring-[#3B9F41]"
              : "border-[#dfe1ed] hover:border-[#b8bcc9]"
            }
            ${isCityMunicipalityDisabled ? "cursor-not-allowed bg-[#f8f9fc] text-[#8b92a7]" : "text-[#2f3339]"}
          `}
        >
          <span className="truncate">{cityMunicipalityDisplayText}</span>
          <div className="flex items-center gap-1">
            {citiesMunicipalitiesState === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin text-[#6b7280]" />
            )}
            {citiesMunicipalitiesState === "error" && (
              <AlertCircle className="h-4 w-4 text-[#c85050]" />
            )}
            {values.cityMunicipality && !isCityMunicipalityDisabled && (
              <X
                className="h-3.5 w-3.5 text-[#9ca3af] hover:text-[#6b7280]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear("cityMunicipality");
                }}
              />
            )}
            <ChevronDown
              className={`h-4 w-4 text-[#6b7280] transition-transform duration-200 ${
                cityMunicipalityDropdown.isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
        <input type="hidden" name={`${name}_city_municipality`} value={values.cityMunicipality?.code || ""} />

        {cityMunicipalityDropdown.isOpen && (
          <DropdownContent
            options={filteredCitiesMunicipalities}
            search={cityMunicipalityDropdown.search}
            setSearch={(search) => setCityMunicipalityDropdown((prev) => ({ ...prev, search }))}
            selectedCode={values.cityMunicipality?.code || ""}
            onSelect={(code) => {
              const cityMunicipality = citiesMunicipalities.find((c) => c.code === code);
              if (cityMunicipality) handleCityMunicipalitySelect(cityMunicipality);
            }}
            loadingState={citiesMunicipalitiesState}
            error={citiesMunicipalitiesError}
            onRetry={() => handleRetry("citiesMunicipalities")}
            placeholder="Search cities/municipalities..."
            disabled={!values.province}
          />
        )}
      </div>

      {/* Barangay Dropdown */}
      <div ref={barangayContainerRef} className="relative">
        <button
          type="button"
          onClick={() => !isBarangayDisabled && setBarangayDropdown((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
          disabled={isBarangayDisabled || barangaysState === "error"}
          className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-sm transition-all duration-200
            ${barangayDropdown.isOpen
              ? "border-[#3B9F41] ring-1 ring-[#3B9F41]"
              : "border-[#dfe1ed] hover:border-[#b8bcc9]"
            }
            ${isBarangayDisabled ? "cursor-not-allowed bg-[#f8f9fc] text-[#8b92a7]" : "text-[#2f3339]"}
          `}
        >
          <span className="truncate">{barangayDisplayText}</span>
          <div className="flex items-center gap-1">
            {barangaysState === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin text-[#6b7280]" />
            )}
            {barangaysState === "error" && (
              <AlertCircle className="h-4 w-4 text-[#c85050]" />
            )}
            {values.barangay && !isBarangayDisabled && (
              <X
                className="h-3.5 w-3.5 text-[#9ca3af] hover:text-[#6b7280]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear("barangay");
                }}
              />
            )}
            <ChevronDown
              className={`h-4 w-4 text-[#6b7280] transition-transform duration-200 ${
                barangayDropdown.isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
        <input type="hidden" name={`${name}_barangay`} value={values.barangay?.code || ""} />
        <input type="hidden" name={name} value={buildFullAddress(values)} />

        {barangayDropdown.isOpen && (
          <DropdownContent
            options={filteredBarangays}
            search={barangayDropdown.search}
            setSearch={(search) => setBarangayDropdown((prev) => ({ ...prev, search }))}
            selectedCode={values.barangay?.code || ""}
            onSelect={(code) => {
              const barangay = barangays.find((b) => b.code === code);
              if (barangay) handleBarangaySelect(barangay);
            }}
            loadingState={barangaysState}
            error={barangaysError}
            onRetry={() => handleRetry("barangays")}
            placeholder="Search barangays..."
            disabled={!values.cityMunicipality}
            includeEmptyOption
            emptyOptionLabel="None / Not Applicable"
          />
        )}
      </div>
    </div>
  );
}

// Dropdown Content Component
function DropdownContent({
  options,
  search,
  setSearch,
  selectedCode,
  onSelect,
  loadingState,
  error,
  onRetry,
  placeholder,
  disabled = false,
  includeEmptyOption = false,
  emptyOptionLabel = "None / Not Applicable",
}: {
  options: LocationOption[];
  search: string;
  setSearch: (search: string) => void;
  selectedCode: string;
  onSelect: (code: string) => void;
  loadingState: LoadingState;
  error: string | null;
  onRetry: () => void;
  placeholder: string;
  disabled?: boolean;
  includeEmptyOption?: boolean;
  emptyOptionLabel?: string;
}) {
  if (disabled) {
    return null;
  }

  return (
    <div className="absolute z-50 mt-1 w-full animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
        <div className="border-b border-[#e5e7eb] p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-[#e5e7eb] bg-[#f9fafb] py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-[#3B9F41] focus:bg-white"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {loadingState === "loading" && (
            <div className="flex items-center justify-center px-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#3B9F41]" />
              <span className="ml-2 text-sm text-[#5d6780]">Loading...</span>
            </div>
          )}

          {loadingState === "error" && (
            <div className="flex flex-col items-center justify-center px-3 py-8">
              <AlertCircle className="h-6 w-6 text-[#c85050]" />
              <p className="mt-2 text-sm text-[#a33a3a]">{error || "Failed to load"}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[#dfe1ed] bg-white px-3 py-1.5 text-xs font-semibold text-[#5d6780] transition hover:bg-[#f3f5fa]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          )}

          {loadingState === "ready" && options.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-[#9ca3af]">
              No results found
            </div>
          )}

          {loadingState === "ready" && includeEmptyOption && (
            <button
              type="button"
              onClick={() => onSelect("")}
              className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm text-[#6b7280] hover:bg-[#f3f5fa]"
            >
              <span>{emptyOptionLabel}</span>
            </button>
          )}

          {loadingState === "ready" && options.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => onSelect(option.code)}
              className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-[#f3f5fa] ${
                selectedCode === option.code
                  ? "bg-[#f0fdf4] text-[#3B9F41]"
                  : "text-[#2f3339]"
              }`}
            >
              <span className="truncate">{option.name}</span>
              {selectedCode === option.code && (
                <Check className="h-4 w-4 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
