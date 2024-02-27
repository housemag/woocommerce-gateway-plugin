const CIValidator = (ci) => {
    if (typeof ci !== 'string') {
        return false;
    }

    let x = 0;
    let y = 0;
    let docCI = 0;
    const dig = ci[ci.length - 1];

    if (ci.length <= 6) {
        for (y = ci.length; y < 7; y += 1) {
            ci = `0${ci}`;
        }
    }

    for (y = 0; y < 7; y += 1) {
        x += (parseInt('2987634'[y], 10) * parseInt(ci[y], 10)) % 10;
    }

    if (x % 10 === 0) {
        docCI = 0;
    } else {
        docCI = 10 - (x % 10);
    }

    return dig === docCI.toString();
}

export default CIValidator;