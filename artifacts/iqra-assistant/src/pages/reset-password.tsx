import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useResetPassword, getGetSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch, Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import logoPng from "@/assets/logo.png";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSeo } from "@/hooks/use-seo";

const resetSchema = z
  .object({
    password: z.string().min(12, { message: "Password must be at least 12 characters." }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export default function ResetPassword() {
  useSeo({
    title: "Set a New Password — IQRA Assistant",
    description: "Choose a new password for your IQRA Assistant account.",
    robots: "noindex, follow",
    canonicalPath: "/reset-password",
  });
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const resetMutation = useResetPassword({
    mutation: {
      onSuccess: (user) => {
        queryClient.setQueryData(getGetSessionQueryKey(), { user });
        toast({ title: "Password updated", description: "You're now signed in." });
        setLocation("/");
      },
      onError: (error: any) => {
        toast({
          title: "Could not reset password",
          description: error?.error || "This reset link may be invalid or expired. Request a new one.",
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(values: z.infer<typeof resetSchema>) {
    resetMutation.mutate({ data: { token, password: values.password } });
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
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Set a new password</CardTitle>
            <CardDescription>Choose a strong password of at least 12 characters.</CardDescription>
          </CardHeader>
          <CardContent>
            {token ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="••••••••••••"
                              {...field}
                              className="bg-background pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-pressed={showPassword}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirm ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="••••••••••••"
                              {...field}
                              className="bg-background pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm((v) => !v)}
                              aria-pressed={showConfirm}
                              aria-label={showConfirm ? "Hide password" : "Show password"}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full font-medium" disabled={resetMutation.isPending}>
                    {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update password
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="text-center space-y-4">
                <CardDescription>
                  This reset link is missing or invalid. Please request a new one.
                </CardDescription>
                <Button asChild className="w-full">
                  <Link href="/forgot-password">Request a new link</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
