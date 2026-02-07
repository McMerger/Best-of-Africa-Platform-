import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    HomeIcon,
    SewingPinIcon,
    StarFilledIcon,
    ArrowRightIcon,
    CheckCircledIcon,
    BackpackIcon,
    RocketIcon,
    BarChartIcon
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useSystemConfig } from "@/hooks/useSystemConfig";

// Define steps
const STEPS = [
    { id: 1, title: 'Service Type', icon: BackpackIcon },
    { id: 2, title: 'Requirements', icon: SewingPinIcon },
    { id: 3, title: 'Contact', icon: HomeIcon },
];

const formSchema = z.object({
    service_type: z.enum(['market_entry', 'due_diligence', 'government_relations', 'trade_mission', 'executive_travel']),
    country_code: z.string().min(2, "Please select a country"),
    dates: z.string().optional(),
    requirements: z.string().min(10, "Please provide more details about your request"),
    budget_range: z.string().optional(),

    user_name: z.string().min(2, "Name is required"),
    user_email: z.string().email("Invalid email address"),
    user_organization: z.string().min(2, "Organization is required"),
    user_phone: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function BookingRequestPage() {
    const { data: config } = useSystemConfig();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedData, setSubmittedData] = useState<{ id: string; ai_brief: string } | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            service_type: 'market_entry',
            country_code: '',
            requirements: '',
            user_name: '',
            user_email: '',
            user_organization: '',
        },
    });

    const nextStep = () => {
        const fieldsToValidate = getFieldsForStep(currentStep);
        form.trigger(fieldsToValidate).then((isValid: boolean) => {
            if (isValid) setCurrentStep((prev) => Math.min(prev + 1, 3));
        });
    };

    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    const getFieldsForStep = (step: number): Array<keyof FormData> => {
        switch (step) {
            case 1: return ['service_type'];
            case 2: return ['country_code', 'dates', 'requirements', 'budget_range'];
            case 3: return ['user_name', 'user_email', 'user_organization', 'user_phone'];
            default: return [];
        }
    };

    async function onSubmit(values: FormData) {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/services/booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (data.success) {
                setSubmittedData({
                    id: data.data.booking_id,
                    ai_brief: data.data.ai_preliminary_brief
                });
                toast.success("Request submitted successfully!");
            } else {
                toast.error(data.message || "Submission failed");
            }
        } catch {
            toast.error("An error occurred. Please try again.");
            // ...
            // ...
            // ...
        } finally {
            setIsSubmitting(false);
        }
    }

    if (submittedData) {
        return (
            <div className="container mx-auto py-12 px-4 max-w-3xl">
                <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
                    <div className="bg-green-50 dark:bg-green-950/20 p-8 text-center border-b border-green-100 dark:border-green-900/50">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircledIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                            Request Received
                        </h2>
                        <p className="text-green-800 dark:text-green-200">
                            Reference ID: <span className="font-mono font-medium">{submittedData.id}</span>
                        </p>
                    </div>

                    <div className="p-8">
                        <div className="mb-6 flex items-start gap-4 p-4 bg-muted/50 rounded-3xl border">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <StarFilledIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    AI Preliminary Assessment
                                    <span className="text-xs uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded border">
                                        Instant Generated
                                    </span>
                                </h3>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                    <p className="whitespace-pre-line">{submittedData.ai_brief}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-muted-foreground">
                            Our concierge team uses this assessment to prepare your final proposal.
                            <br />You will receive a detailed follow-up within 24 hours.
                        </p>

                        <div className="mt-8 flex justify-center">
                            <Button onClick={() => window.location.href = '/'}>
                                Return to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif font-bold mb-3">{config?.['booking_hero_headline'] || "Concierge Request"}</h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        {config?.['booking_hero_subhead'] || "Book strategic services tailored to your market entry and expansion needs. Receive an instant AI preliminary assessment upon submission."}
                    </p>
                </div>

                {/* Steps */}
                <div className="flex items-center justify-between mb-10 px-12">
                    {STEPS.map((step, idx) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center relative z-10">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isActive
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : isCompleted
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-background border-muted text-muted-foreground'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-xs font-medium mt-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {step.title}
                                </span>

                                {/* Connector Line */}
                                {idx !== STEPS.length - 1 && (
                                    <div className="absolute top-5 left-1/2 w-full h-[2px] -z-10 bg-muted">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: isCompleted ? '100%' : '0%' }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <Card className="shadow-lg border-muted">
                    <CardContent className="p-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                {/* Step 1: Service Type */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { id: 'market_entry', label: 'Market Entry Strategy', icon: BarChartIcon },
                                                { id: 'due_diligence', label: 'Partner Due Diligence', icon: CheckCircledIcon },
                                                { id: 'government_relations', label: 'Government Relations', icon: HomeIcon },
                                                { id: 'executive_travel', label: 'Executive Travel', icon: RocketIcon },
                                                { id: 'trade_mission', label: 'Trade Mission Support', icon: BackpackIcon },
                                            ].map((service) => (
                                                <div key={service.id} className="relative">
                                                    <input
                                                        type="radio"
                                                        id={service.id}
                                                        value={service.id}
                                                        {...form.register('service_type')}
                                                        className="peer sr-only"
                                                    />
                                                    <label
                                                        htmlFor={service.id}
                                                        className="flex flex-col items-center justify-center p-6 bg-background border-2 rounded-lg cursor-pointer hover:bg-muted/50 peer-checked:border-primary peer-checked:bg-primary/5 transition-all text-center h-full"
                                                    >
                                                        <service.icon className="w-8 h-8 mb-3 text-muted-foreground peer-checked:text-primary" />
                                                        <span className="font-medium text-sm">{service.label}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Requirements */}
                                {currentStep === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <FormField
                                            control={form.control}
                                            name="country_code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Target Country</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a country" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="NG">Nigeria</SelectItem>
                                                            <SelectItem value="ZA">South Africa</SelectItem>
                                                            <SelectItem value="EG">Egypt</SelectItem>
                                                            <SelectItem value="KE">Kenya</SelectItem>
                                                            <SelectItem value="GH">Ghana</SelectItem>
                                                            <SelectItem value="RW">Rwanda</SelectItem>
                                                            <SelectItem value="MA">Morocco</SelectItem>
                                                            <SelectItem value="Other">Other / Multi-Country</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="dates"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Preferred Dates (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. March 2026" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="budget_range"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Budget Range (USD)</FormLabel>
                                                        <FormControl>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select range" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="<10k">Under $10k</SelectItem>
                                                                    <SelectItem value="10k-50k">$10k - $50k</SelectItem>
                                                                    <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                                                                    <SelectItem value="100k+">$100k+</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="requirements"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Specific Requirements</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Please describe your objectives, constraints, and any specific support needed..."
                                                            className="h-32 resize-none"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Step 3: Contact */}
                                {currentStep === 3 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <FormField
                                            control={form.control}
                                            name="user_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="John Doe" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="user_email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Business Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="john@company.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="user_organization"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Organization</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Company Name" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="user_phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="+1 ..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between pt-6 border-t mt-8">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={prevStep}
                                        disabled={currentStep === 1 || isSubmitting}
                                    >
                                        Back
                                    </Button>

                                    {currentStep < 3 ? (
                                        <Button type="button" onClick={nextStep}>
                                            Next Step <ArrowRightIcon className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                            {!isSubmitting && <StarFilledIcon className="w-4 h-4 ml-2" />}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
