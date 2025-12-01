/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

const SocialAuth = ({
  provider,
  disabled
}: {
  provider: "google" | "github" | "discord";
  disabled: boolean
}) => {
  const [isSubmitting, setIsSubmititng] = useState(false);
  const iconSrc =
    provider === "google"
      ? "/google.svg"
      : provider === "github"
      ? "/github.svg"
      : "/discord.svg";

  const size = provider === "google" ? 12 : provider === "github" ? 18 : 18;

  const label =
    provider === "google"
      ? "Sign in with Google"
      : provider === "github"
      ? "Sign in with Github"
      : "Sign in with Discord";

  const handleAction = async () => {
    setIsSubmititng(true);
    await authClient.signIn.social(
      { provider, callbackURL: "/dashboard" },
      {
        onError: (error) => {
          toast.error(
            error.error.message || `Failed to sign in with ${provider}`
          );
        },
        onSuccess: () => {
          setIsSubmititng(false);
        },
      }
    );
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleAction}
      className="w-full"
      disabled={isSubmitting || disabled}
    >
      <img
        className="mr-1"
        src={iconSrc}
        alt={`${provider} logo`}
        width={size}
        height={size}
      />
      {label}
    </Button>
  );
};

export default SocialAuth;
