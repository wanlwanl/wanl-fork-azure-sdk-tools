# Test function

``` ts

class Base {

}

class Derived1 extends Base {
    a: string
}

class Derived2 extends Base {
    a: number
}

class Derived3 extends Base {
    b: boolean
}

export function basic_compatible(basic_compatible_para_1_baseline: string, basic_compatible_para_2_baseline: string): string;
export function basic_incompatible(basic_compatible_para_1_baseline: number, basic_compatible_para_2_baseline: string): string;

export function type_guard_compatible(type_guard_compatible_para_1_baseline: Derived1 | Derived2): type_guard_compatible_para_1_baseline is Derived1;
export function type_guard_incompatible_1(type_guard_incompatible_1_para_1_current: Derived3 | Derived2): type_guard_incompatible_1_para_1_current is Derived1;
export function type_guard_incompatible_2(type_guard_incompatible_2_para_1_current: Derived1 | Derived2): type_guard_incompatible_2_para_1_current is Derived2;


```
