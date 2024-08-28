```ts

export type z =  "a" | "B" | 'c';
export type y =  "aa" | "bB";
export type x =  "Aa" | "bb";

// same
export interface Routes0 {
    (path: "path1"): string;
    (path: "path2"): string;
}

// add path2
export interface Routes1 {
    (path: "path1"): string;
    (path: "path2"): string;
}

// remove path2
export interface Routes2 {
    (path: "path1"): string;
}

// change path2
export interface Routes3 {
    (path: "path1"): string;
    (path: "path3"): string;
}
```