use libc::c_double;

fn rs_add(val1: f64, val2: f64) -> f64 {
    val1 + val2
}

#[no_mangle]
pub extern "C" fn add(val1: c_double, val2: c_double) -> c_double {
    return rs_add(val1, val2);
}
