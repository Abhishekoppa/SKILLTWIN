import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { BrainCircuit, Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await login(values);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      form.setError("root", { message: "Invalid credentials" });
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 text-center text-white max-w-lg">
          <BrainCircuit className="w-20 h-20 text-primary mx-auto mb-8" />
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">SkillTwin</h1>
          <p className="text-xl text-slate-300 leading-relaxed">
            Stop guessing your skill levels. Prove your capabilities with actual code and dynamic AI evaluations.
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to your account to continue building your evidence-based profile.
            </p>
          </div>

          <div className="mt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">Email address</FormLabel>
                      <FormControl>
                        <Input className="h-12 bg-slate-50" placeholder="you@example.com" {...field} />
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
                      <FormLabel className="text-slate-700 font-semibold">Password</FormLabel>
                      <FormControl>
                        <Input className="h-12 bg-slate-50" type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.root && (
                  <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-center">
                    {form.formState.errors.root.message}
                  </div>
                )}
                <Button type="submit" className="w-full h-12 text-base font-bold shadow-sm" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Logging in...</> : "Sign In"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-8 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors">
                Create one now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
