# Test Case

```ts
class Base {
    b: string
}

class Derived extends Base {
    d: number
}

export interface Routes_Inherit {
    method_base_compatible(b: string, c: number): string
    method_base_incompatible(method_base_incompatible_parameter_1_current: string, method_base_incompatible_parameter_2_current: number): string
    (path: "path_base_add"): string;
}

// TODO: add multi-pair breaking change
export interface Routes_Extends extends Routes_Inherit {
    // test call signatures
    (path: "path_nochange"): string;
    (path: "path_add"): string;
    (path: "path_cross_remove"): string;

    // test methods
    method_return_type_incompatible(a: string): string
    // NOTE: assignable
    method_return_type_incompatible_any(a: string): any
    method_return_type_compatible(a: string): string
    method_parameter_type_incompatible(method_parameter_type_incompatible_parameter_current: string): string
    method_parameter_type_compatible(method_parameter_type_compatible_parameter_current: string): string
    // NOTE: assignable
    method_parameter_type_incompatible_concrete_type_to_any(method_parameter_type_incompatible_concrete_type_to_any_parameter_baseline: any): string
    // NOTE: assignable
    method_parameter_list_count_incompatible_more_to_less(a: string): string
    method_parameter_list_count_change_incompatible_less_to_more(a: string, b: string): string
    method_parameter_optional_incompatible(a?: string): string
    method_parameter_optional_compatible(a: string): string

    // test arrow functions
    arrow_function_return_type_incompatible: (a: string) => string
    // NOTE: assignable
    arrow_function_return_type_incompatible_any: (a: string) => any
    arrow_function_return_type_compatible: (a: string) => string
    arrow_function_parameter_type_incompatible: (arrow_function_parameter_type_incompatible_parameter_current: string) => string
    arrow_function_parameter_type_compatible: (arrow_function_parameter_type_compatible_parameter_current: string) => string
    // NOTE: assignable
    arrow_function_parameter_type_incompatible_concrete_type_to_any: (arrow_function_parameter_type_incompatible_concrete_type_to_any_parameter_baseline: any) => string
    // NOTE: assignable
    arrow_function_parameter_list_count_incompatible_more_to_less: (a: string) => string
    arrow_function_parameter_list_count_change_incompatible_less_to_more: (a: string, b: string) => string
    arrow_function_parameter_optional_incompatible: (a?: string) => string
    arrow_function_parameter_optional_incompatible2?: (a: string) => string
    arrow_function_parameter_optional_compatible: (a: string) => string

    // test cross between arrow functions and methods
    cross_function_parameter_type_incompatible_1: (cross_function_parameter_type_incompatible_parameter_1_current: string) => string
    cross_function_parameter_type_incompatible_2(cross_function_parameter_type_incompatible_parameter_1_current: string): string
    cross_function_parameter_type_compatible_1(cross_function_parameter_type_compatible_parameter_1_current: number): string
    cross_function_parameter_type_compatible_2: (cross_function_parameter_type_compatible_parameter_1_current: number) => string

    // test properties
    prop: string
    prop_add: string
    prop_optional?: string
    prop_required: string
    prop_compatible: Derived
    prop_incompatible: Base
    // NOTE: assignable
    prop_incompatible_any: any
    prop_compatible_any: number
    prop_classic_to_other: () => string
    prop_classic_to_other2(): string
    prop_other_to_classic: string
    prop_other_to_classic2: string
    prop_any_to_classic: string
    prop_classic_to_any: any
    prop_readonly_to_mutable: string
    readonly prop_mutable_to_readonly: string
}

```
