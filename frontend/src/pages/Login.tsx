import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaceAuth } from "@/components/FaceAuth";
import { TrendingUp, Mail, Lock } from "lucide-react";
import { useLoginMutation } from "../../Redux/Api/authApi/Auth";
import { useSelector } from "react-redux";
import { RootState } from "../../Redux/store";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
export default function Login() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const [login, { isLoading, error }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await login(data).unwrap();
      // Optionally: refetch user info here if needed
      navigate("/dashboard");
    } catch (err: any) {
      // Show API error on form
      setError("root", { message: err?.data?.message || "Login failed" });
    }
  };
  const handleFaceLogin = () => {
    // Mock face authentication success
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">SAIS</CardTitle>
          <CardDescription>Sign in to your trading account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="traditional" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional">Email & Password</TabsTrigger>
              <TabsTrigger value="face">Face Recognition</TabsTrigger>
            </TabsList>

            <TabsContent value="traditional" className="space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      className="pl-10"
                      {...register("email")}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      {...register("password")}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                {errors.root && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.root.message}
                  </p>
                )}
                {error && !errors.root && (
                  <p className="text-xs text-red-500 mt-1">
                    {(error as any)?.data?.message || "Login failed"}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="face" className="space-y-4">
              <FaceAuth onSuccess={handleFaceLogin} />
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Demo credentials: any email/password combination works
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
