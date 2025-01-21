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
import { formatDateRange, parseDateRangeString } from "@/lib/dateUtils";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";

export const FormSchema = z
  .object({
    year: z.string({
      required_error: "Please select a year.",
    }),
    country: z.string({
      required_error: "Please select a country.",
    }),
    subdivision: z.string({
      required_error: "Please select a subdivision.",
    }),
    rawVacationDates: z.string().optional(),
    vacationDates: z
      .array(
        z.object({
          start: z.date(),
          end: z.date(),
        })
      )
      .optional(),
  })
  .transform((data) => {
    if (data.rawVacationDates) {
      const vacationDates = data.vacationDates || [];
      return {
        ...data,
        vacationDates: [
          ...vacationDates,
          ...parseDateRangeString(data.rawVacationDates, parseInt(data.year)),
        ],
      };
    }
    return data;
  });

export type FormValues = z.infer<typeof FormSchema>;

export default function CountrySubdivisionSelector({
  countries,
  years,
  onFetchSubdivisions,
}: LocationSelectorProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      vacationDates: [],
    },
  });

  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rawVacationDatesInputValue, setRawVacationDatesInputValue] = useState<string>("");
  
  const rawVacationDates = form.watch("rawVacationDates");
  const vacationDates = form.watch("vacationDates");
  const selectedCountry = form.watch("country");

  // Watch form values for re-renders
  const formValues = form.watch();

  // console log form errors
  console.log(form.formState.errors);

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

  // We trigger revalidation to update vacationDates
  useEffect(() => {
    form.trigger("vacationDates");
  }, [form, rawVacationDates]);

  const handleRemoveVacationDate = async (index: number) => {
    if (!vacationDates) return;
    form.setValue(
      "vacationDates",
      vacationDates.filter((_, i: number) => i !== index),
      { shouldValidate: false }
    );
    await form.trigger("vacationDates");
  };

  const handleAddVacationDate = () => {
    if (!rawVacationDatesInputValue) return;
    form.setValue("rawVacationDates", rawVacationDatesInputValue);
    setRawVacationDatesInputValue("");
  };

  function onSubmit(data: FormValues) {
    console.log("Form submitted:", data);
    // Handle form submission here
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Location and Year Selector</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                form.setValue("year", year);
                              }}
                            >
                              {year}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  year === field.value
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
                        disabled={!formValues.country || isLoading}
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
            name="rawVacationDates"
            render={() => (
              <FormItem>
                <FormLabel>Vacation Dates</FormLabel>
                <FormControl>
                <div className="flex space-x-2">

                  <Input
                    placeholder="Enter dates (e.g., 23.04;24.04-27.04;23.06)"
                    aria-label="Enter vacation dates"
                    value={rawVacationDatesInputValue}
                    onChange={(e) => setRawVacationDatesInputValue(e.target.value)}
                  />
                    <Button type="button" onClick={handleAddVacationDate}>Add</Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            {vacationDates &&
              vacationDates.map((range, index) => (
                <Card key={index}>
                  <CardContent className="flex items-center justify-between p-2">
                    <span>{formatDateRange(range)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveVacationDate(index)}
                      aria-label={`Remove date ${formatDateRange(range)}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>

          <Button type="submit">Submit</Button>
        </form>
      </Form>

      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Form Values:</h2>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(formValues, null, 2)}
        </pre>
      </div>
    </div>
  );
}
