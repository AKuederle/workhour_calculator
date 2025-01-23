import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { LocationSelectorProps, Subdivision } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateParseError, formatDateRange, parseDateRangeString } from "@/lib/dateUtils";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";

const dateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
});

type DateRange = z.infer<typeof dateRangeSchema>;

const transformVacationDates = (data: {
  year: number;
  rawVacationDates?: string;
  vacationDates?: DateRange[];
}) => {
  const vacationDates = data.vacationDates || [];
  if (!data.rawVacationDates) {
    return {
      vacationDates: [...vacationDates],
    };
  }
  return {
    vacationDates: [
      ...vacationDates,
      ...parseDateRangeString(data.rawVacationDates, data.year),
    ],
  };
};

export const BaseFormSchema = z
.object({
  country: z.string({
    required_error: "Please select a country.",
  }),
  subdivision: z.string({
    required_error: "Please select a subdivision.",
  }),
  year: z.number({
    required_error: "Please select a year.",
  }),
  offOnChristmasEve: z.boolean().optional(),
  offOnNewYearsEve: z.boolean().optional(),
  protestantCommunity: z.boolean().optional(),
  vacationDates: z.array(dateRangeSchema).optional(),
  sickDates: z.array(dateRangeSchema).optional(),
})

export const FormSchema = z.object(
  {...BaseFormSchema.shape,
    rawVacationDates: z.string().optional(),
    rawSickDates: z.string().optional(),
  })
  .transform((data) => {
    let result = data;
    if (data.rawVacationDates) {
      result = { ...result, ...transformVacationDates(data) };
    }
    if (data.rawSickDates) {
      result = {
        ...result,
        sickDates: [
          ...(data.sickDates || []),
          ...parseDateRangeString(data.rawSickDates, data.year),
        ],
      };
    }
    return result;
  });

export type FormValues = z.infer<typeof FormSchema>;

export default function CountrySubdivisionSelector({
  countries,
  years,
  onFetchSubdivisions,
  onSubmit,
}: LocationSelectorProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      vacationDates: [],
      sickDates: [],
      country: "DE",
      year: new Date().getFullYear(),
      offOnChristmasEve: true,
      offOnNewYearsEve: true,
      protestantCommunity: true,
    },
  });

  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rawVacationDatesInputValue, setRawVacationDatesInputValue] =
    useState<string>("");
  const [rawSickDatesInputValue, setRawSickDatesInputValue] = useState<string>("");

  const vacationDates = form.watch("vacationDates");
  const sickDates = form.watch("sickDates");
  const selectedCountry = form.watch("country");
  const selectedYear = form.watch("year");

  // Effect to handle country changes
  useEffect(() => {
    async function fetchSubdivisions() {
      if (!selectedCountry) {
        setSubdivisions([]);
        return;
      }

      form.setValue("subdivision", "");
      form.clearErrors("subdivision");
      setIsLoading(true);

      try {
        const subdivisionData = await onFetchSubdivisions(selectedCountry);
        setSubdivisions(subdivisionData);
        // We set an oppinionated default, if the country is Germany, we set the subdivision to "DE-BE"
        if (selectedCountry === "DE") {
          form.setValue("subdivision", "DE-BY");
        }
      } catch (err) {
        form.setError("subdivision", {
          message:
            err instanceof Error ? err.message : "Failed to fetch subdivisions",
        });
        setSubdivisions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubdivisions();
  }, [selectedCountry, form, onFetchSubdivisions]);

  const handleRemoveVacationDate = async (index: number) => {
    if (!vacationDates) return;
    form.setValue(
      "vacationDates",
      vacationDates.filter((_: DateRange, i: number) => i !== index),
      { shouldValidate: false }
    );
    await form.trigger("vacationDates");
  };

  const handleAddVacationDate = () => {
    if (!rawVacationDatesInputValue || !selectedYear) return;

    try {
      const result = transformVacationDates({
        year: selectedYear,
        rawVacationDates: rawVacationDatesInputValue,
        vacationDates: form.getValues("vacationDates"),
      });

      form.setValue("vacationDates", result.vacationDates);
      setRawVacationDatesInputValue("");
      form.clearErrors("rawVacationDates");
    } catch (error) {
      console.log(error);
      form.setError("rawVacationDates", {
        message: error instanceof DateParseError ? `${error.fieldValue}: ${error.detail}` : "Invalid date format",
      });
    }
  };

  const handleRemoveSickDate = async (index: number) => {
    if (!sickDates) return;
    form.setValue(
      "sickDates",
      sickDates.filter((_: DateRange, i: number) => i !== index),
      { shouldValidate: false }
    );
    await form.trigger("sickDates");
  };

  const handleAddSickDate = () => {
    if (!rawSickDatesInputValue || !selectedYear) return;

    try {
      const result = {
        sickDates: [
          ...(form.getValues("sickDates") || []),
          ...parseDateRangeString(rawSickDatesInputValue, selectedYear),
        ],
      };

      form.setValue("sickDates", result.sickDates);
      setRawSickDatesInputValue("");
      form.clearErrors("rawSickDates");
    } catch (error) {
      console.log(error);
      form.setError("rawSickDates", {
        message: error instanceof DateParseError ? `${error.fieldValue}: ${error.detail}` : "Invalid date format",
      });
    }
  };

  function handleSubmit(data: FormValues) {
    // As we don't want to prevent that users update the date after they added vacation dates, we need to clean them here and update all dates
    // that don't match the selected year
    const vacationDates = data.vacationDates || [];
    const year = data.year;
    const updatedVacationDates = vacationDates.map((date) => ({
      ...date,
      start: new Date(year, date.start.getMonth(), date.start.getDate()),
      end: new Date(year, date.end.getMonth(), date.end.getDate()),
    }));
    data = { ...data, vacationDates: updatedVacationDates };
    onSubmit(data);
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Location and Year Selector</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? `${countries.find((c) => c.code === field.value)?.name} (${field.value})`
                          : "Select a country..."}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search country..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {countries.map((country) => (
                            <CommandItem
                              key={country.name}
                              onSelect={() => {
                                form.setValue("country", country.code);
                              }}
                            >
                              {country.name} ({country.code})
                              <Check
                                className={cn(
                                  "ml-auto",
                                  country.code === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subdivision"
            disabled={!selectedCountry || isLoading}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subdivision</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={!selectedCountry || isLoading}
                      >
                        {isLoading
                          ? "Loading..."
                          : field.value
                            ? `${subdivisions.find((s) => s.code === field.value)?.name} (${field.value})`
                            : "Select a subdivision..."}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search subdivision..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No subdivision found.</CommandEmpty>
                        <CommandGroup>
                          {subdivisions.map((subdivision) => (
                            <CommandItem
                              key={subdivision.code}
                              onSelect={() => {
                                form.setValue("subdivision", subdivision.code);
                              }}
                            >
                              {subdivision.name} ({subdivision.code})
                              <Check
                                className={cn(
                                  "ml-auto",
                                  subdivision.code === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Select a year..."}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search year..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No year found.</CommandEmpty>
                        <CommandGroup>
                          {years.map((year) => (
                            <CommandItem
                              key={year}
                              value={year}
                              onSelect={() => {
                                form.setValue("year", parseInt(year));
                              }}
                            >
                              {year}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  parseInt(year) === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="offOnChristmasEve"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Off on Christmas Eve</FormLabel>
                  <FormDescription>
                    If you are off on Christmas Eve (aka full day off without the need to take vacation days), check this box.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="offOnNewYearsEve"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Off on New Years Eve</FormLabel>
                  <FormDescription>
                    If you are off on New Years Eve (aka full day off without the need to take vacation days), check this box.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="protestantCommunity"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Protestant Community</FormLabel>
                  <FormDescription>
                    If you are part of the protestant community, some holidays might not apply for you, even if you live in a country/state that celebrates them.
                    The only edge case that we are currently implementing is "Mariä Himmelfahrt" (Ascension of Mary) in Bavaria/Germany.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="rawVacationDates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vacation Dates</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="e.g. 24.12-31.12"
                        {...field}
                        value={rawVacationDatesInputValue}
                        onChange={(e) =>
                          setRawVacationDatesInputValue(e.target.value)
                        }
                      />
                    </FormControl>
                    <Button type="button" onClick={handleAddVacationDate}>
                      Add
                    </Button>
                  </div>
                  <FormDescription>
                    Enter vacation dates in the format DD.MM-DD.MM
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {vacationDates && vacationDates.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Added Vacation Dates:</h3>
                  <ul className="space-y-2">
                    {vacationDates.map((date, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span>{formatDateRange(date)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVacationDate(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="rawSickDates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sick Days</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="e.g. 24.12-31.12"
                        {...field}
                        value={rawSickDatesInputValue}
                        onChange={(e) =>
                          setRawSickDatesInputValue(e.target.value)
                        }
                      />
                    </FormControl>
                    <Button type="button" onClick={handleAddSickDate}>
                      Add
                    </Button>
                  </div>
                  <FormDescription>
                    Enter sick days in the format DD.MM-DD.MM
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sickDates && sickDates.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Added Sick Days:</h3>
                  <ul className="space-y-2">
                    {sickDates.map((date, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span>{formatDateRange(date)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSickDate(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}
