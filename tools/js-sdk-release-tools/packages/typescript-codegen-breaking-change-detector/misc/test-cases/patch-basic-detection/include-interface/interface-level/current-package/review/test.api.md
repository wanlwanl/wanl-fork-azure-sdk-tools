# Test Interface

```ts
export interface basic {
    s: string
}

export interface basic<Y> {
    s: Y
}


export interface basic<X extends number> {
    s: X
}

export interface basic_add {
    s: string
}
```
