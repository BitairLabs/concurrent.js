package main

import "C"

func go_add(x float64, y float64) float64 {
	return x + y
}

//export add
func add(x C.double, y C.double) C.double {
	return C.double(go_add(float64(x), float64(y)))
}

func main() {}
