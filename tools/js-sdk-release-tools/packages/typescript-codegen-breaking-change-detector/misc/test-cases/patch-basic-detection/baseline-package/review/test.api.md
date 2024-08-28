
```ts

export type x =  "aa" | "bb";
export type y =  "aa" | "BB";
export type z =  "B" | 'c' | "a";

export interface Routes0 {
    (path: "path1"): string;
    (path: "path2"): string;
}

export interface Routes1 {
    (path: "path1"): string;
}

export interface Routes2 {
    (path: "path1"): string;
    (path: "path2"): string;
}

export interface Routes3 {
    (path: "path1"): string;
    (path: "path2"): string;
}
```