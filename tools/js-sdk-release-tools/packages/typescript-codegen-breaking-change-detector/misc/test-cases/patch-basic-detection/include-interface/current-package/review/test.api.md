```ts

export type z =  "a" | "B" | 'c';
export type y =  "aa" | "bB";
export type x =  "Aa" | "bb";

export interface Routes_Change {
    (path: "path1"): string;
    (path: "path_change"): string;
}

export interface Routes_Add {
    (path: "path1"): string;
}
```