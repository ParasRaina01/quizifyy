"use client";

import { Button } from "./ui/button";
import { signIn } from "next-auth/react";

export default function NavbarSignInButton() {
  return (
    <Button
      onClick={() => signIn("google")}
      variant="outline"
      size="sm"
      className="text-sm"
    >
      Sign in
    </Button>
  );
} 