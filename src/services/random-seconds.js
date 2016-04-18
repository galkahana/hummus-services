module.exports = function(min,max) {
    return (min + (max - min)*Math.random())*1000;
}
