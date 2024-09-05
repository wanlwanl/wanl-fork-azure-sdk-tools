```ts

// export interface Routes_Change {
//     (path: "path1"): string;
//     (path: "path_change"): string;
// }

// export interface Routes_Add {
//     (path: "path1"): string;
// }

export interface Routes_Inherit {
    aa: string
    test1(b: string, c: number): string
    test_base_incompatible: (b: string, c: number) => string
    (path: "path_base_add"): string;
}

export interface Routes_Extends extends Routes_Inherit {
    a: string

    // test call signatures
    (path: "path2"): string;
    (path: "path3_add"): string;
    (path: "path1_remove2"): string;

    // test functions
    test_incompatible_1(a: string): string
    test_incompatible_2: (a: string) => string
    test_add: (a: string) => number
    test_mix: (a: string) => boolean

    // test properties
    prop: string
    prop_add: string
    prop_optional?: string
    prop_required: string
}

```