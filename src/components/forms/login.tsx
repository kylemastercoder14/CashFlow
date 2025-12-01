"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import SocialAuth from "@/components/social-auth";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.email(),
  password: z.string(),
  rememberMe: z.boolean(),
});

export const LoginForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        callbackURL: "/dashboard",
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to login");
        },
      }
    );
  }

  const isSubmitting = form.formState.isSubmitting;
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="m@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    <a
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 underline"
                    >
                      Forgot your password?
                    </a>
                  </div>

                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      type="password"
                      placeholder="Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="w-full flex gap-2 items-center">
                  <FormControl>
                    <Checkbox
                      disabled={isSubmitting}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Remember me</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button disabled={isSubmitting} type="submit" className="w-full mt-4">
            {isSubmitting ? "Loggin in..." : "Login"}
          </Button>
          <div className="my-5 w-full flex items-center justify-center overflow-hidden">
            <Separator />
            <span className="text-sm px-2">OR</span>
            <Separator />
          </div>
          <div className="space-y-3">
            <SocialAuth disabled={isSubmitting} provider="google" />
            <SocialAuth disabled={isSubmitting} provider="github" />
            <SocialAuth disabled={isSubmitting} provider="discord" />
          </div>
        </form>
      </Form>
      <p className="text-muted-foreground text-center mt-5 text-xs">
        Don&apos;t have an account?{" "}
        <a href="/auth/sign-up" className="underline text-primary">
          Sign up
        </a>
      </p>
    </div>
  );
};
