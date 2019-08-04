# IR Design

The proposed IR is a form of structured SSA. Typical SSA IRs are
unstructured and are made up of functions containing a linear series
of instructions with labels and jump instructions that can be at suchused
to form more complex control flow statements such as if-statements,
while-statements or for-statements. Hwoever, as this IR is design to
be easily compilable to WebAssembly it is helpful for it to be structured
as WebAssembly by itself is structured and doesn't allow arbitrary jumps
to be represented without more complex transformations such as a loop
with nested if-statements. As the source language aslo doesn't allow for
arbitrary jumps this means that usuch complex transofmrations also don't
have to be made in the fronted of the compiler. SSA helps with the static
analysis of the program and allows for certain optimizations such as
constant folding to be implemented without much afford.

Functions and structured blocks are made up of a series of other blocks.
This creates a tree like structure. Nevertheless SSA limitations have
significance

## Mixing structure and SSA

Abstract IR example

```
function[inlinable, exported(a)] a (si32 %0) -> ()
[si32, ui32, si32, si32, si32, ui32]
{
  {
    %1 = 0
  }
  block {
    {
      %2 = %1 < %0
      breakIfFalse %2
    }
    loop {
      {
        %3 = phi(%1, %5)
        printInteger %3
        %4 = 1
        %5 = %3 + %4
        %6 = %3 < %0
        breakIfFalse %6
      }
    }
  }
}
```
