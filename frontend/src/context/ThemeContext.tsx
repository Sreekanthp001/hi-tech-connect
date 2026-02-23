import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>("light");
    const [isManual, setIsManual] = useState(false);

    // Function to determine theme based on time
    const getAutoTheme = (): Theme => {
        const hours = new Date().getHours();
        // 6 AM (6) to 6 PM (18) is Light Mode
        return hours >= 6 && hours < 18 ? "light" : "dark";
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        const savedManual = localStorage.getItem("theme-manual") === "true";

        if (savedManual && savedTheme) {
            setThemeState(savedTheme);
            setIsManual(true);
        } else {
            setThemeState(getAutoTheme());
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);

        // Also update storage
        localStorage.setItem("theme", theme);
        localStorage.setItem("theme-manual", isManual.toString());
    }, [theme, isManual]);

    // Handle automatic updates every minute if not manual
    useEffect(() => {
        if (isManual) return;

        const interval = setInterval(() => {
            const autoTheme = getAutoTheme();
            if (theme !== autoTheme) {
                setThemeState(autoTheme);
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [theme, isManual]);

    const toggleTheme = () => {
        setIsManual(true);
        setThemeState((prev) => (prev === "light" ? "dark" : "light"));
    };

    const setTheme = (newTheme: Theme) => {
        setIsManual(true);
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
