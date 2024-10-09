# Test Interface

```ts
export interface basic {
    s: string
}

export interface basic<X> {
    s: X
}

export interface basic<X extends string> {
    s: X
}

// TODO: support it
export interface basic_remove {
    s: string
}
```
