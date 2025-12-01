"use client";

import React, { useEffect } from "react";
import { LightRays } from "@/components/light-rays";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data !== null) router.push("/dashboard");
    });
  }, [router]);
  return (
    <div className="relative h-screen w-full flex flex-col justify-center items-center overflow-hidden">
      <LightRays />
      <main className="max-w-md! mx-auto">{children}</main>
      <p className="text-muted-foreground text-center mt-5 text-xs">
        built by <span className="text-white">kylemastercoder14 with ❤️</span>
      </p>
    </div>
  );
};

export default Layout;
