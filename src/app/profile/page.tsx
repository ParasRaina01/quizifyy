import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import SignOutButton from "@/components/SignOutButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function ProfilePage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold">Profile Settings</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{session.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{session.user.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <SignOutButton />
              <Separator className="hidden sm:block" orientation="vertical" />
              <DeleteAccountButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 