import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { HeartHandshake } from "lucide-react";
import { Link } from "wouter";

export default function ThankYou() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary/20 text-secondary mb-4">
            <HeartHandshake className="w-12 h-12" />
          </div>
          
          <h1 className="text-4xl font-serif font-bold text-foreground">Jazakallah Khair</h1>
          
          <div className="space-y-4 text-muted-foreground text-lg">
            <p>
              Thank you for your generous support. Your contribution directly helps sustain and improve IQRA Assistant.
            </p>
            <p>
              May your wealth be blessed and increased.
            </p>
          </div>
          
          <div className="pt-8">
            <Link href="/" className="inline-flex">
              <Button size="lg" className="px-8 font-medium">
                Return to Chat
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
