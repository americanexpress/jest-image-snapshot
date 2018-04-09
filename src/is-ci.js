function isCI() {
  return !!process.env.CI;
}

module.exports = {
  isCI,
};
