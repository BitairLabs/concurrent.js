double cpp_add(double val1, double val2)
{
  double result = val1 + val2;
  return result;
}

extern "C"
{
  double add(double val1, double val2)
  {
    return cpp_add(val1, val2);
  }
}