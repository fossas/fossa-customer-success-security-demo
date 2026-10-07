// A tiny "team status board" app. Every dependency here is pinned to an old,
// vulnerable version on purpose so FOSSA has real issues to show.
const path = require('path');
const express = require('express');
const _ = require('lodash');
const moment = require('moment');

const DEFAULT_TEAM = [
  { name: 'Ada', role: 'Platform', status: 'shipping' },
  { name: 'Grace', role: 'Security', status: 'reviewing' },
  { name: 'Linus', role: 'Infra', status: 'on call' },
];

function createApp(team = DEFAULT_TEAM) {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.use(express.json());

  // HTML status board rendered with ejs.
  app.get('/', (req, res) => {
    const byRole = _.groupBy(team, 'role');
    res.render('index', { byRole, updated: moment().format('LLL') });
  });

  // JSON API: list members, optionally filtered by status.
  app.get('/api/team', (req, res) => {
    const { status } = req.query;
    const members = status ? _.filter(team, { status }) : team;
    res.json({ count: members.length, members: _.sortBy(members, 'name') });
  });

  // Merge a partial update into a member's record.
  app.post('/api/team/:name', (req, res) => {
    const member = _.find(team, { name: req.params.name });
    if (!member) return res.status(404).json({ error: 'not found' });
    _.merge(member, _.pick(req.body, ['role', 'status']));
    res.json(member);
  });

  app.get('/healthz', (req, res) => res.json({ ok: true, uptime: moment.duration(process.uptime(), 'seconds').humanize() }));

  return app;
}

module.exports = { createApp, DEFAULT_TEAM };
