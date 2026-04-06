import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { GlobeIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
    const { language, setLanguage } = useLanguage();

    const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);

    const getFlag = (code: string) => {
        const flags: Record<string, string> = {
            en: "🇺🇸",
            pt: "🇵🇹",
            fr: "🇫🇷",
            de: "🇩🇪",
            zh: "🇨🇳",
            ar: "🇦🇪",
            hi: "🇮🇳"
        };
        return flags[code] || "🌐";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 gap-3 rounded-full border border-border/40 bg-background/50 hover:bg-primary/10 hover:text-primary transition-all px-4">
                    <span className="text-lg">{getFlag(language)}</span>
                    <span className="hidden lg:inline-block font-bold text-xs uppercase tracking-widest">{currentLang?.name}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                            language === lang.code
                                ? "bg-primary text-primary-foreground font-bold"
                                : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                        )}
                    >
                        <span className="text-xl">{getFlag(lang.code)}</span>
                        <div className="flex flex-col">
                            <span className="text-sm">{lang.name}</span>
                            <span className="text-[9px] uppercase tracking-tighter opacity-70">{lang.code} • {lang.dir.toUpperCase()}</span>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
