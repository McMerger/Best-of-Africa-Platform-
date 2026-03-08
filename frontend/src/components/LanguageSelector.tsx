import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { GlobeIcon } from "@radix-ui/react-icons";

export function LanguageSelector() {
    const { language, setLanguage } = useLanguage();

    const currentLangName = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name || "English";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2">
                    <GlobeIcon className="h-4 w-4" />
                    <span className="hidden sm:inline-block">{currentLangName}</span>
                    <span className="sm:hidden">{language.toUpperCase()}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={language === lang.code ? "bg-accent font-medium" : ""}
                    >
                        {lang.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
