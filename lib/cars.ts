import data from "@/data/cars.json";

export type Car = {
  Name: string;
  Model: string;
  Image: string;
  Price: number;
  Location: string;
  Category: string;
  Fuel: string;
};

export const cars: Car[] = data;

export const CATEGORY_LABELS: Record<string, string> = { hatch: "Hatch", sedan: "Sedã", suv: "SUV" };
