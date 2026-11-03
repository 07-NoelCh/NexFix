module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['tests/support/**/*.ts', 'tests/step_definitions/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress', 'html:reports/cucumber.html'],
    publishQuiet: true
  }
};
