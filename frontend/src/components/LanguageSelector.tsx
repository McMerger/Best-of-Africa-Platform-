import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { cn } from "@/lib/utils";

import { GlobeIcon } from "@radix-ui/react-icons";

export function LanguageSelector() {
    const { language, setLanguage } = useLanguage();



    // Emojis removed for a more professional look
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full hover:bg-foreground/50 hover:text-primary transition-all px-2.5">
                    <GlobeIcon className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline-block font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{language}</span>
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
                                ? "bg-background text-foreground font-bold"
                                : "hover:bg-background/10 text-muted-foreground hover:text-primary"
                        )}
                    >
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
