/**
 * Creates a d_1 x d_2 x d_3 x ... d_n matrix with each element initialized to value
 *
 * @param {((...indices: number) => T) | T} value
 *      A constant value, or a function of the indices of element to construct
 * @param {number} [dimensions]
 *      d_1, d_2, d_3 ... d_n
 * @returns {any}
 * @template T
 */
function createMatrix(value, ...dimensions) {
    /**
     * @param {number[]} indices
     * @param {number[]} dimensions
     */
    function _createMatrix(indices, dimensions) {
        if(dimensions.length === 0) {
            return value instanceof Function ? value(...indices) : value;
        }
        return new Array(dimensions[0]).fill(null).map((_, i) => _createMatrix(
            [...indices, i], dimensions.slice(1)
        ));
    }

    return _createMatrix([], dimensions)
}

/**
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
function randInt(start, end) {
    return start + ~~(Math.random() * (end - start))
}

/**
 * @param {Iterable<T>} collection
 * @returns T
 * @template T
 */
function randEl(collection) {
    let lst = [...collection];
    return lst[randInt(0, lst.length)];
}