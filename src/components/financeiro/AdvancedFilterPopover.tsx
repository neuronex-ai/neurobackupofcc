"use client";

import type { ReactNode } from "react";
import { Calendar, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PopoverAlign = "start" | "center" | "end";

export interface FilterOption<T extends string> {
    id: T;
    label: string;
}

interface AdvancedFilterPopoverProps {
    activeFilters: number;
    children: ReactNode;
    onClear: () => void;
    onApply?: () => void;
    triggerLabel?: string;
    clearLabel?: string;
    applyLabel?: string;
    align?: PopoverAlign;
    widthClassName?: string;
}

export function AdvancedFilterPopover({
    activeFilters,
    children,
    onClear,
    onApply,
    triggerLabel = "Filtros",
    clearLabel = "Limpar",
    applyLabel = "Aplicar",
    align = "start",
    widthClassName = "w-[min(960px,calc(100vw-56px))]",
}: AdvancedFilterPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-12 rounded-[18px] border-zinc-200 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.18em] dark:border-white/10 dark:bg-white/[0.035]">
                    <Filter className="mr-2 h-4 w-4" />
                    {triggerLabel} {activeFilters > 0 ? `(${activeFilters})` : ""}
                </Button>
            </PopoverTrigger>
            <PopoverContent align={align} sideOffset={12} className={cn(widthClassName, "overflow-hidden rounded-[28px] border-zinc-200 bg-white/95 p-0 shadow-[0_36px_90px_-36px_rgba(0,0,0,0.45)] backdrop-blur-3xl dark:border-white/10 dark:bg-zinc-950/95")}>
                {children}
                <div className="flex items-center justify-end gap-3 border-t border-zinc-200/70 bg-zinc-50/80 px-7 py-4 dark:border-white/10 dark:bg-white/[0.025]">
                    <Button variant="outline" onClick={onClear} className="h-11 rounded-full px-6 text-[10px] font-black uppercase tracking-[0.16em]">
                        {clearLabel}
                    </Button>
                    <Button onClick={onApply} className="h-11 rounded-full bg-zinc-950 px-7 text-[10px] font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950">
                        {applyLabel}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function FilterDateGroup({
    title,
    start,
    end,
    onStart,
    onEnd,
}: {
    title: string;
    start: string;
    end: string;
    onStart: (value: string) => void;
    onEnd: (value: string) => void;
}) {
    return (
        <div>
            <p className="mb-3 text-sm font-black tracking-tight text-zinc-900 dark:text-white">{title}</p>
            <div className="flex flex-wrap items-center gap-3">
                <DateInput value={start} onChange={onStart} />
                <span className="text-xs font-semibold text-zinc-400">até</span>
                <DateInput value={end} onChange={onEnd} />
            </div>
        </div>
    );
}

export function DateInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className="relative">
            <input
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 w-[150px] rounded-[14px] border border-zinc-200 bg-white px-3 pr-9 text-xs font-bold text-zinc-700 outline-none dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        </div>
    );
}

export function FilterCheckGroup<T extends string>({
    title,
    options,
    selected,
    onToggle,
    twoColumns = false,
}: {
    title: string;
    options: FilterOption<T>[];
    selected: T[];
    onToggle: (id: T) => void;
    twoColumns?: boolean;
}) {
    return (
        <div>
            <p className="mb-4 text-sm font-black tracking-tight text-zinc-900 dark:text-white">{title}</p>
            <div className={cn("grid gap-3", twoColumns ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                {options.map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                        <Checkbox checked={selected.includes(option.id)} onCheckedChange={() => onToggle(option.id)} />
                        {option.label}
                    </label>
                ))}
            </div>
        </div>
    );
}
