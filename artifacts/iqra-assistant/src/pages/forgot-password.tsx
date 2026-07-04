import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForgotPassword } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import logoPng from "@/assets/logo.png";
import { Loader2, MailCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useSeo } from "@/hooks/use-seo";

const forgotSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export default function ForgotPassword() {
  useSeo({
    title: "Reset Password — IQRA Assistant",
    description: "Request a password reset link for your IQRA Assistant account.",
    robots: "noindex, follow",
    canonicalPath: "/forgot-password",
  });
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const forgotMutation = useForgotPassword({
    mutation: {
      onSuccess: () => setSubmitted(true),
      onError: () => setSubmitted(true),
    },
  });

  function onSubmit(values: z.infer<typeof forgotSchema>) {
    forgotMutation.mutate({ data: values });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logoPng} alt="IQRA Assistant" className="w-16 h-16 rounded-md mb-4 shadow-md" />
          <h1 className="font-serif text-3xl font-bold text-foreground">IQRA Assistant</h1>
          <p className="text-muted-foreground mt-2 text-center">Wisdom and guidance rooted in tradition</p>
        </div>

        <Card className="border-border/50 shadow-lg shadow-primary/5">
          {submitted ? (
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MailCheck className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">Check your email</CardTitle>
              <CardDescription>
                If an account exists for that email, we've sent a link to reset your password. The link expires
                in one hour.
              </CardDescription>
              <Button asChild variant="outline" className="w-full mt-2">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Forgot your password?</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a link to reset it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="username"
                              placeholder="name@example.com"
                              {...field}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full font-medium" disabled={forgotMutation.isPending}>
                      {forgotMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send reset link
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-border/50 pt-6">
                <p className="text-sm text-muted-foreground">
                  Remembered it?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
