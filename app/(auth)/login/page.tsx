import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { PasswordInputField } from "@/src/components/auth/password-input-field";
import { DemoAccountSection } from "./demo-account-section";

type InputFieldProps = {
  name: string;
  type: "email" | "password";
  placeholder: string;
  autoComplete?: string;
  icon: ReactNode;
  trailingIcon?: ReactNode;
};

function InputField({
  name,
  type,
  placeholder,
  autoComplete,
  icon,
  trailingIcon,
}: InputFieldProps) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4E5971]/70">
        {icon}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-[46px] w-full rounded-[9px] border border-[#D7E1E2] bg-[#FAFCFC] pl-12 pr-12 text-[15px] text-[#2E363A] outline-none placeholder:text-[#4E5971]/70 focus:border-[#1CB061]/70 focus:ring-2 focus:ring-[#1CB061]/15"
      />
      {trailingIcon ? (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4E5971]/60">
          {trailingIcon}
        </span>
      ) : null}
    </label>
  );
}

function MailIcon() {
  return <Mail aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />;
}

type LoginPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  > | Record<string, string | string[] | undefined>;
};

function getQueryParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const loginError = getQueryParam(params.error);

  return (
    <main className="min-h-screen bg-white lg:h-[100dvh] lg:overflow-hidden">
      <div className="flex min-h-screen w-full flex-col lg:h-full lg:flex-row">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0C7F4F] via-[#16A15D] to-[#1CB061] px-5 py-6 text-white sm:px-8 sm:py-8 lg:h-full lg:flex-[0.85] lg:px-10 lg:py-10">
          <Image
            src="/lg_bg.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 43vw, 100vw"
            className="pointer-events-none object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-[#0C7F4F]/25" />
          <div className="relative flex min-h-[300px] flex-col sm:min-h-[360px] lg:min-h-full">
            <div className="flex flex-1 items-center justify-center pt-4 sm:pt-8 lg:pt-12">
              <div className="relative flex h-[190px] w-full max-w-[485px] items-center justify-center sm:h-[230px] lg:h-[273px]">
                <Image
                  src="/da_logo.png"
                  alt="Department of Agriculture logo"
                  width={500}
                  height={500}
                  priority
                  className="h-auto w-[170px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.28)] sm:w-[205px] lg:w-[400px]"
                />
              </div>
            </div>

            <div className="relative mt-4 pb-1 sm:mt-6 lg:mt-0 lg:pb-4">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/85">
                Department of Agriculture
              </p>
              <h1 className="mt-3 max-w-[28rem] text-2xl font-semibold tracking-tight sm:text-[1.75rem] lg:text-[2rem]">
                Travel Order Management System
              </h1>
              <p className="mt-3 max-w-[30rem] text-sm leading-6 text-white/85 sm:text-[15px]">
                Create, submit, and track travel orders in one secure workspace.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center bg-white px-4 py-8 sm:px-6 sm:py-10 lg:h-full lg:flex-[1.15] lg:px-10 lg:py-6">
          <div className="w-full max-w-[487px] rounded-[5.5px]  bg-white lg:min-h-[469px]">
            <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-[40px] lg:pb-[52px] lg:pt-[42px]">
              <h2 className="text-[26px] font-semibold tracking-tight text-[#2E363A]">
                LOGIN
              </h2>

              {loginError ? (
                <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {loginError}
                </div>
              ) : null}

              <form className="mt-10" method="post" action="/api/auth/login">
                <div className="space-y-[30px]">
                  <InputField
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    icon={<MailIcon />}
                  />

                  <PasswordInputField
                    name="password"
                    autoComplete="current-password"
                    placeholder="Password"
                  />
                </div>

                <div className="mt-[22px] flex justify-end">
                  <Link
                    href="#"
                    className="text-sm font-medium text-[#1CB061] transition-colors hover:text-[#159650] focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#1CB061]/25"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  id="login-submit-btn"
                  className="mt-[16px] inline-flex h-[47px] w-full items-center justify-center rounded-[9px] bg-[#3B9F41] text-sm font-semibold text-white transition-colors hover:bg-[#359436] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB061]/30 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    SIGN ME IN
                  </span>
                </button>
              </form>

              <DemoAccountSection />

              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    document.getElementById('login-submit-btn').closest('form').addEventListener('submit', function(e) {
                      var btn = document.getElementById('login-submit-btn');
                      btn.disabled = true;
                      btn.querySelector('span').innerHTML = '<svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing in...';
                    });
                  `,
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
