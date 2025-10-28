import React, { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../../Redux/Api/authApi/Auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Users,
  BarChart3,
  ArrowRight,
  Mail,
  Lock,
  User,
  ChevronDown,
} from "lucide-react";
import { UserPopover } from "@/components/User";
import { useSelector } from "react-redux";
import { RootState } from "../../Redux/store";

const tickerItems = [
  { symbol: "AAPL", price: "145.09", change: -2.45, down: true },
  { symbol: "TSLA", price: "724.12", change: -8.34, down: true },
  { symbol: "AMZN", price: "3342.88", change: +12.67, down: false },
  { symbol: "NFLX", price: "510.18", change: -5.23, down: true },
  { symbol: "GOOGL", price: "2458.32", change: +18.45, down: false },
  { symbol: "MSFT", price: "421.35", change: +3.21, down: false },
];

// Zod schema for registration form
const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function HomePage() {
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  // Connect to RTK Query registration mutation
  const [registerUser, { isLoading, error, isSuccess }] = useRegisterMutation();

  // Redirect to /dashboard on successful registration
  useEffect(() => {
    if (isSuccess) {
      toast("Registration Successful", {
        description: "Welcome! Redirecting to your dashboard...",
      });
      setTimeout(() => navigate("/dashboard"), 1200);
    }
  }, [isSuccess, navigate]);

  const onSubmit = async (data: RegisterForm) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    };
    try {
      await registerUser(payload).unwrap();
      reset();
    } catch (e: any) {
      let message = "Registration failed. Please try again.";
      if (
        e &&
        typeof e === "object" &&
        "data" in e &&
        e.data &&
        typeof e.data === "object" &&
        "message" in e.data
      ) {
        message = e.data.message;
      }
      toast("Registration Failed", {
        description: message,
      });
    }
  };
  const [activeTab, setActiveTab] = useState("login");

  // Smooth scrolling for navigation
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Get user from Redux auth slice
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/android-chrome-512x512.png"
                alt="SAIS Logo"
                className="w-8 h-8 rounded-md"
                onError={() => setLogoError(true)}
              />

              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                SAIS Project
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-8 ">
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("membership")}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  Membership
                </button>
              </nav>
              {/* User popover */}
              <UserPopover className="border-none shadow-none !bg-transparent" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-100 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 " />
        <div className="container mx-auto relative z-10 max-w-4xl">
          <div className="mb-8 flex justify-center">
            <img
              src="/android-chrome-512x512.png"
              alt="SAIS Logo"
              className="w-20 h-20 rounded-full shadow-lg"
              onError={() => setLogoError(true)}
            />
          </div>
          <Badge variant="secondary" className="mb-6 text-sm">
            Financial Education Platform
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to the{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SAIS Project
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            We empower people to understand and explore the stock market. Our
            platform combines learning tools and simulations to make investing
            easier and smarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => scrollToSection("membership")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Join the Community
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("features")}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 px-6 bg-white/50 dark:bg-gray-900/50"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              About Our Team
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We are a passionate team of students on a mission: to bring
              financial literacy and stock market knowledge to everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Hassan Al Qahtani",
                role: "Lead Developer",
                image: "/AlQahtani.jpeg",
                description:
                  "Full-stack developer with expertise in React and modern web technologies.",
              },
              {
                name: "Mohamed Alblooshi",
                role: "Web Engineer",
                image: "/Alblooshi.jpeg",
                description:
                  "Frontend specialist focused on creating intuitive user experiences.",
              },
              {
                name: "Mohamed Almenhali",
                role: "Researcher",
                image: "/Almenhali.jpeg",
                description:
                  "Financial markets researcher and data analysis expert.",
              },
            ].map((member, index) => (
              <Card
                key={index}
                className="text-center group hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900">
                    <img
                      src={member.image}
                      alt={member.name}
                      className={`w-full h-full group-hover:scale-105 transition-transform duration-300 object-cover `}
                      style={index === 0 ? { objectPosition: "center 10%" } : index === 1 ? { objectPosition: "center 30%" } : { objectPosition: "center 45%", transform: "scale(1.3)" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {member.name}
                  </h3>
                  <Badge variant="secondary" className="mb-3">
                    {member.role}
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advisor Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Advisor
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Guided by industry expertise and years of financial market experience
            </p>
          </div>

          <div className="flex justify-center">
            <Card className="w-full md:w-96 group hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900">
                  <img
                    src="/Nidal-Saleh.jpeg"
                    alt="Nidal Saleh"
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300 object-cover"
                    style={{ objectPosition: "center 0%" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Nidal Saleh
                  </h3>
                  <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Advisor
                  </Badge>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    With extensive experience in financial markets and investment strategy, Nidal brings invaluable insights and mentorship to guide our platform and community towards success.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-6 bg-gradient-to-tl from-white via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 "
      >
        <div className="container mx-auto max-w-6xl ">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Platform Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explore our comprehensive platform that combines education with
              practice. Learn, test strategies, and simulate trading without
              risk.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Learning Hub",
                description:
                  "Access comprehensive guides and resources designed to make stock markets understandable for beginners and valuable for experts.",
                color: "from-blue-500 to-blue-600",
              },
              {
                icon: BarChart3,
                title: "Trading Simulation",
                description:
                  "Practice trading with virtual portfolios and gain real experience without the risk of losing actual money.",
                color: "from-green-500 to-green-600",
              },
              {
                icon: Users,
                title: "Community",
                description:
                  "Join a growing network of learners and investors, share strategies, and learn from each other's experiences.",
                color: "from-purple-500 to-purple-600",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section
        id="membership"
        className="py-20 px-6 bg-white/50 dark:bg-gray-900/50"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Join Our Community
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Start your financial learning journey today
            </p>
          </div>

          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl" />

            <Card className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-3xl overflow-hidden flex ">
              {/* Header section with gradient */}
              <div className="bg-gradient-to-r from-blue-600  to-indigo-600 p-8 text-center flex flex-col items-center justify-center w-1/2">
                {/* <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"> */}
                <img
                  src="/android-chrome-512x512.png"
                  alt="SAIS Logo"
                  className="w-14 h-14 rounded-md"
                  onError={() => setLogoError(true)}
                />
                {/* </div> */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  Join the Revolution
                </h3>
                <p className="text-blue-100">
                  Start your financial journey with cutting-edge tools
                </p>
              </div>

              <CardContent className="p-8">
                {/* React Hook Form with Zod validation */}
                <form
                  className="space-y-6"
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                >
                  {/* Name fields with modern styling */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <Label
                        htmlFor="firstName"
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                      >
                        First Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Enter your first name"
                          className="pl-10 h-9 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                          {...register("firstName")}
                          aria-invalid={!!errors.firstName}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.firstName.message as string}
                        </p>
                      )}
                    </div>
                    <div className="group">
                      <Label
                        htmlFor="lastName"
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Last Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Enter your last name"
                          className="pl-10 h-9 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                          {...register("lastName")}
                          aria-invalid={!!errors.lastName}
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.lastName.message as string}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="group">
                    <Label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 h-9 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                        {...register("email")}
                        aria-invalid={!!errors.email}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email.message as string}
                      </p>
                    )}
                  </div>

                  {/* Password fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <Label
                        htmlFor="password"
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a strong password"
                          className="pl-10 h-9 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                          {...register("password")}
                          aria-invalid={!!errors.password}
                        />
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.password.message as string}
                        </p>
                      )}
                    </div>
                    <div className="group">
                      <Label
                        htmlFor="confirmPassword"
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          className="pl-10 h-9 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                          {...register("confirmPassword")}
                          aria-invalid={!!errors.confirmPassword}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.confirmPassword.message as string}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Create Account Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full h-10 text-sm bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting || isLoading
                        ? "Creating..."
                        : "Create Your Account"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    {/* Registration error display */}
                    {error && (
                      <div className="pt-2">
                        <p className="text-xs text-red-500 text-center">
                          {typeof error === "object" &&
                            error &&
                            "data" in error &&
                            error.data &&
                            typeof error.data === "object" &&
                            "message" in error.data
                            ? (error.data as any).message
                            : "Registration failed. Please try again."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Trust indicators */}
                  <div className="pt-4 text-center">
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Secure & Encrypted
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Instant Setup
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        Free Forever
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stock Ticker */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800">
        <div className="overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap py-3">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <div key={index} className="flex items-center space-x-2 mx-8">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.symbol}
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  ${item.price}
                </span>
                <span
                  className={`flex items-center text-sm ${item.down ? "text-red-500" : "text-green-500"
                    }`}
                >
                  {item.down ? (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  )}
                  {item.down ? item.change : `+${item.change}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-8 px-6 mb-16">
        <div className="container mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © 2025 SAIS Project — Stock Market Learning Platform
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
