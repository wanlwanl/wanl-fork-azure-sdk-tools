```ts
// export interface Routes_Change {
//     (path: "path1"): string;
//     (path: "path2"): string;
// }

// export interface Routes_Remove {
//     (path: "path1"): string;
//     (path: "path2"): string;
// }

class Base {
    b: string
}

class Derived extends Base {
    d: number
}

export interface Routes_Inherit {
    method_base_compatible(b: string, d: number): string
    method_base_incompatible(method_base_incompatible_parameter_1_baseline: number, method_base_incompatible_parameter_2_baseline: number): string
    (path: "path_base_remove"): string;
    (path: "path_cross_remove"): number;
}

export interface Routes_Extends extends Routes_Inherit {
    // test call signatures
    (path: "path_remove"): string;
    (path: "path_nochange"): string;
    
    // test methods
    method_return_type_incompatible(a: string): number
    // NOTE: assignable
    method_return_type_incompatible_any(a: string): number
    method_return_type_compatible(a: string): any
    method_parameter_type_incompatible(method_parameter_type_incompatible_parameter_baseline: number): string
    method_parameter_type_compatible(method_parameter_type_compatible_parameter_baseline: any): string
    // NOTE: assignable
    method_parameter_type_incompatible_concrete_type_to_any(method_parameter_type_incompatible_concrete_type_to_any_parameter_baseline: number): string
    // NOTE: assignable
    method_parameter_list_count_incompatible_more_to_less(a: string, b: number): string
    method_parameter_list_count_change_incompatible_less_to_more(a: string): string
    method_parameter_optional_incompatible(a: string): string
    method_parameter_optional_compatible(a?: string): string

    // test arrow functions
    arrow_function_return_type_incompatible: (a: string) => number
    // NOTE: assignable
    arrow_function_return_type_incompatible_any: (a: string) => number
    arrow_function_return_type_compatible: (a: string) => any
    arrow_function_parameter_type_incompatible: (arrow_function_parameter_type_incompatible_parameter_baseline: number) => string
    arrow_function_parameter_type_compatible: (arrow_function_parameter_type_compatible_parameter_baseline: any) => string
    // NOTE: assignable
    arrow_function_parameter_type_incompatible_concrete_type_to_any: (arrow_function_parameter_type_incompatible_concrete_type_to_any_parameter_baseline: number) => string
    // NOTE: assignable
    arrow_function_parameter_list_count_incompatible_more_to_less: (a: string, b: number) => string
    arrow_function_parameter_list_count_change_incompatible_less_to_more: (a: string) => string
    arrow_function_parameter_optional_incompatible: (a: string) => string
    arrow_function_parameter_optional_incompatible2: (a: string) => string
    arrow_function_parameter_optional_compatible: (a?: string) => string

    // test cross between arrow functions and methods
    cross_function_parameter_type_incompatible_1(cross_function_parameter_type_incompatible_parameter_1_baseline: number): string
    cross_function_parameter_type_incompatible_2: (cross_function_parameter_type_incompatible_parameter_1_baseline: number) => string
    cross_function_parameter_type_compatible_1(cross_function_parameter_type_compatible_parameter_1_baseline: number): string
    cross_function_parameter_type_compatible_2: (cross_function_parameter_type_compatible_parameter_1_baseline: number) => string

    // test properties
    prop: string
    prop_remove: string
    prop_optional: string
    prop_required?: string
    prop_compatible: Base
    prop_incompatible: Derived
    // NOTE: assignable
    prop_incompatible_any: number
    prop_compatible_any: any
    prop_classic_to_other: string
    prop_classic_to_other2: string
    prop_other_to_classic: () => string
    prop_other_to_classic2(): string
    prop_any_to_classic: any
    prop_classic_to_any: string
}

```