import Link from "next/link";
import { Contact } from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";
import { getOptionalSession } from "@/lib/session";
import { ModeToggle } from "./ui/mode-toggle";

/** Primary navigation links shown to authenticated users. */
const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/deals", label: "Deals" },
] as const;

export async function SiteHeader() {
  // Gate the primary nav behind authentication so signed-out visitors only see
  // the landing-page branding. Validity is re-checked in each protected page.
  const session = await getOptionalSession();

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:border focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>
      <header className="border-b" role="banner">
        <nav
          className="container mx-auto flex items-center justify-between gap-4 px-3 py-3 sm:px-4 sm:py-4"
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold sm:text-2xl">
              <Link
                href="/"
                className="text-primary hover:text-primary/80 flex items-center gap-2 transition-colors"
                aria-label="ConsultCRM - Go to homepage"
              >
                <div
                  className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg"
                  aria-hidden="true"
                >
                  <Contact className="h-5 w-5" />
                </div>
                <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
                  ConsultCRM
                </span>
              </Link>
            </h1>
            {session && (
              <div className="hidden items-center gap-6 sm:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4" role="group" aria-label="User actions">
            <UserProfile />
            <ModeToggle />
          </div>
        </nav>
      </header>
    </>
  );
}
