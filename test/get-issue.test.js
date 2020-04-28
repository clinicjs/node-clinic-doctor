'use strict'

const { test } = require('tap')
const ClinicDoctor = require('../index.js')

test('get issue', function (t) {
  const tool = new ClinicDoctor({ dest: './foo' })
  const issue = tool.getIssue()
  t.equal(issue, null)
  t.end()
})
