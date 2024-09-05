```ts
// export interface Routes_Change {
//     (path: "path1"): string;
//     (path: "path2"): string;
// }

// export interface Routes_Remove {
//     (path: "path1"): string;
//     (path: "path2"): string;
// }

export interface Routes_Inherit {
    aa: string
    test1(b: string, c: number): string
    test_base_incompatible: (b: string, c: string) => string
    (path: "path_base_remove"): string;
}

export interface Routes_Extends extends Routes_Inherit {
    // test call signatures
    (path: "path1_remove1"): string;
    (path: "path1_remove2"): number;
    (path: "path2"): string;
    
    // test functions
    test_incompatible_1(a: string): number
    test_incompatible_2: (a: string) => number
    test_remove: (a: string) => number
    test_mix(a: string): boolean

    // test properties
    prop: string
    prop_remove: string
    prop_optional: string
    prop_required?: string
}

```