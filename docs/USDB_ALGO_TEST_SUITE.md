# USDB Algorithmic Language Compiler - Test Suite

## 1. LEXICAL & BASIC SYNTAX TESTS

### TEST CASE 1.1: Basic Hello World
```algo
ALGORITHM HelloWorld
BEGIN
    PRINT("Hello, World!")
END.
```

### TEST CASE 1.2: Variable Declarations & Types
```algo
ALGORITHM VarTypes
VAR
    i, j : INTEGER
    x, y : REAL
    flag : BOOLEAN
    letter : CHAR
    name : STRING
BEGIN
    i <- 10
    x <- 3.14
    flag <- TRUE
    letter <- 'A'
    name <- "USDB"
    PRINT(i, x, flag, letter, name)
END.
```

### TEST CASE 1.3: Constants
```algo
ALGORITHM ConstantsTest
CONST
    PI = 3.14159
    MAX_COUNT = 100
    MSG = "Welcome"
VAR
    radius, area : REAL
BEGIN
    radius <- 5.0
    area <- PI * radius * radius
    PRINT(MSG, "Area:", area)
END.
```

## 2. EXPRESSIONS & OPERATORS

### TEST CASE 2.1: Arithmetic Operators
```algo
ALGORITHM Arithmetic
VAR 
    a, b, res : INTEGER
    f1, f2 : REAL
BEGIN
    a <- 10
    b <- 3
    res <- a + b * 2   // Should be 16
    res <- (a + b) * 2 // Should be 26
    res <- a DIV b     // Integer division (3)
    res <- a MOD b     // Modulo (1)
    f1 <- 2.0
    f2 <- f1 ^ 3       // Power (8.0)
END.
```

### TEST CASE 2.2: Logical & Relational Operators
```algo
ALGORITHM LogicTest
VAR
    a, b : INTEGER
    check : BOOLEAN
BEGIN
    a <- 5
    b <- 10
    check <- (a < b) AND (b > 0)
    check <- (a = b) OR (a <> b)
    check <- NOT (a <= 5)
END.
```

## 3. CONTROL STRUCTURES

### TEST CASE 3.1: If-Then-Else
```algo
ALGORITHM IfElseTest
VAR x : INTEGER
BEGIN
    x <- 10
    IF (x > 0) THEN
        PRINT("Positive")
    ELSE
        PRINT("Non-positive")
    
    IF (x > 5) THEN
        IF (x < 20) THEN
            PRINT("Between 5 and 20")
END.
```

### TEST CASE 3.2: Switch Case
```algo
ALGORITHM SwitchTest
VAR grade : CHAR
BEGIN
    grade <- 'B'
    SWITCH grade BEGIN
        CASE 'A' : PRINT("Excellent")
        CASE 'B' : PRINT("Good")
        CASE 'C' : PRINT("Fair")
        DEFAULT : PRINT("Unknown")
    END
END.
```

### TEST CASE 3.3: Loops
```algo
ALGORITHM LoopTest
VAR i : INTEGER
BEGIN
    // For Loop
    FOR i <- 1 TO 5 DO
        PRINT(i)
    
    // For Loop with Step
    FOR i <- 0 TO 10 STEP 2 DO
        PRINT(i)
    
    // While Loop
    i <- 3
    WHILE (i > 0) DO
    BEGIN
        PRINT(i)
        i <- i - 1
    END
    
    // Do While Loop
    i <- 0
    DO
        PRINT(i)
        i <- i + 1
    WHILE (i < 3)
END.
```

## 4. DATA STRUCTURES

### TEST CASE 4.1: Arrays
```algo
ALGORITHM ArrayTest
CONST N = 5
VAR
    Vect : ARRAY[N] OF INTEGER
    Mat : ARRAY[3][3] OF INTEGER
    i, j : INTEGER
BEGIN
    FOR i <- 0 TO N-1 DO
        Vect[i] <- i * i
    
    FOR i <- 0 TO 2 DO
        FOR j <- 0 TO 2 DO
            Mat[i][j] <- i + j
    
    PRINT(Vect[2])    // Should be 4
    PRINT(Mat[1][1])  // Should be 2
END.
```

### TEST CASE 4.2: Structures
```algo
ALGORITHM StructTest
TYPE
    Point = STRUCTURE
    BEGIN
        x : REAL
        y : REAL
    END
VAR
    p1 : Point
BEGIN
    p1.x <- 5.5
    p1.y <- 10.2
    PRINT("Point:", p1.x, p1.y)
END.
```

### TEST CASE 4.3: Nested Structures
```algo
ALGORITHM NestedData
TYPE
    Date = STRUCTURE
    BEGIN
        D : INTEGER
        M : INTEGER
        Y : INTEGER
    END
    Student = STRUCTURE
    BEGIN
        ID : INTEGER
        BirthDate : Date
        Grades : ARRAY[3] OF REAL
    END
VAR
    S1 : Student
BEGIN
    S1.ID <- 2023001
    S1.BirthDate.D <- 15
    S1.BirthDate.M <- 5
    S1.BirthDate.Y <- 2000
    S1.Grades[0] <- 12.5
    PRINT("Student ID:", S1.ID)
END.
```

## 5. FUNCTIONS & PROCEDURES

### TEST CASE 5.1: Simple Function
```algo
ALGORITHM FuncTest
VAR res : INTEGER

FUNCTION Square(n : INTEGER) : INTEGER
BEGIN
    RETURN(n * n)
END

BEGIN
    res <- Square(5)
    PRINT("5 squared is:", res)
END.
```

### TEST CASE 5.2: Procedure with VAR Parameter
```algo
ALGORITHM ProcRefTest
VAR num : INTEGER

PROCEDURE Increment(VAR x : INTEGER)
BEGIN
    x <- x + 1
END

BEGIN
    num <- 10
    Increment(num)
    PRINT("Num should be 11:", num)
END.
```

### TEST CASE 5.3: Recursion
```algo
ALGORITHM RecursionTest
VAR res : INTEGER

FUNCTION Fib(n : INTEGER) : INTEGER
BEGIN
    IF (n <= 1) THEN
        RETURN(n)
    ELSE
        RETURN(Fib(n-1) + Fib(n-2))
END

BEGIN
    res <- Fib(6)  // Should be 8
    PRINT("Fib(6) =", res)
END.
```

## 6. ERROR HANDLING (Negative Tests)

### ERROR CASE 7.1: Undeclared Variable
```algo
ALGORITHM Error1
BEGIN
    x <- 10  // Error: x not declared
END.
```

### ERROR CASE 7.2: Type Mismatch
```algo
ALGORITHM Error2
VAR i : INTEGER
BEGIN
    i <- "Hello"  // Error: Cannot assign STRING to INTEGER
END.
```

### ERROR CASE 7.3: Invalid Array Index
```algo
ALGORITHM Error3
VAR T : ARRAY[5] OF INTEGER
BEGIN
    T["index"] <- 1  // Error: Index must be integer
END.
```
