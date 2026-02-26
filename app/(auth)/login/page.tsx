import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

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
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7L11.06 11.947C11.4 12.185 11.57 12.304 11.754 12.35C11.916 12.391 12.084 12.391 12.246 12.35C12.43 12.304 12.6 12.185 12.94 11.947L20 7M6.4 19H17.6C18.72 19 19.28 19 19.708 18.782C20.084 18.59 20.39 18.284 20.582 17.908C20.8 17.48 20.8 16.92 20.8 15.8V8.2C20.8 7.08 20.8 6.52 20.582 6.092C20.39 5.716 20.084 5.41 19.708 5.218C19.28 5 18.72 5 17.6 5H6.4C5.28 5 4.72 5 4.292 5.218C3.916 5.41 3.61 5.716 3.418 6.092C3.2 6.52 3.2 7.08 3.2 8.2V15.8C3.2 16.92 3.2 17.48 3.418 17.908C3.61 18.284 3.916 18.59 4.292 18.782C4.72 19 5.28 19 6.4 19Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.2 10.4V8.6C7.2 5.955 9.355 3.8 12 3.8C14.645 3.8 16.8 5.955 16.8 8.6V10.4M7.04 20.2H16.96C18.304 20.2 18.976 20.2 19.489 19.938C19.94 19.708 20.308 19.34 20.538 18.889C20.8 18.376 20.8 17.704 20.8 16.36V14.24C20.8 12.896 20.8 12.224 20.538 11.711C20.308 11.26 19.94 10.892 19.489 10.662C18.976 10.4 18.304 10.4 16.96 10.4H7.04C5.696 10.4 5.024 10.4 4.511 10.662C4.06 10.892 3.692 11.26 3.462 11.711C3.2 12.224 3.2 12.896 3.2 14.24V16.36C3.2 17.704 3.2 18.376 3.462 18.889C3.692 19.34 4.06 19.708 4.511 19.938C5.024 20.2 5.696 20.2 7.04 20.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.9 12C4.6 8.9 7.8 7 12 7C16.2 7 19.4 8.9 21.1 12C19.4 15.1 16.2 17 12 17C7.8 17 4.6 15.1 2.9 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14.5C13.381 14.5 14.5 13.381 14.5 12C14.5 10.619 13.381 9.5 12 9.5C10.619 9.5 9.5 10.619 9.5 12C9.5 13.381 10.619 14.5 12 14.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
    <main className="min-h-screen bg-white">
      <div className="mr-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:flex-row">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0C7F4F] via-[#16A15D] to-[#1CB061] px-5 py-6 text-white sm:px-8 sm:py-8 lg:basis-[43.125%] lg:px-10 lg:py-10">
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

        <section className="flex flex-1 items-center justify-center bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <div className="w-full max-w-[487px] rounded-[5.5px] border border-[#BDC2CB] bg-white lg:min-h-[469px]">
            <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-[40px] lg:pb-[106px] lg:pt-[68px]">
              <h2 className="text-[26px] font-semibold tracking-tight text-[#2E363A]">
                Log in to your account
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

                  <InputField
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    icon={<LockIcon />}
                    trailingIcon={<EyeIcon />}
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
                  className="mt-[16px] inline-flex h-[47px] w-full items-center justify-center rounded-[9px] bg-[#1CB061] text-sm font-semibold text-white transition-colors hover:bg-[#179953] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB061]/30 cursor-pointer"
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
