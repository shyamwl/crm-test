import Link from "next/link";
import { redirect } from "next/navigation";
import { Contact, FileText, Handshake, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOptionalSession } from "@/lib/session";

/** Feature highlights shown on the landing page. */
const features = [
  {
    icon: Users,
    title: "Clients",
    description: "Keep a tidy record of everyone you work with.",
  },
  {
    icon: Handshake,
    title: "Deals",
    description: "Track every opportunity from open to won.",
  },
  {
    icon: FileText,
    title: "Notes",
    description: "Capture context so nothing slips through the cracks.",
  },
];

export default async function Home() {
  // Signed-in users go straight to their dashboard.
  const session = await getOptionalSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-12 text-center">
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
              <Contact className="text-primary h-7 w-7" />
            </div>
            <h1 className="from-primary via-primary/90 to-primary/70 bg-gradient-to-r bg-clip-text text-5xl font-bold tracking-tight text-transparent">
              ConsultCRM
            </h1>
          </div>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            A lightweight CRM for solo consultants — manage clients, track deals, and stay on top of
            every opportunity.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <div
                  className="bg-primary/10 mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
                  aria-hidden="true"
                >
                  <Icon className="text-primary h-4 w-4" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
