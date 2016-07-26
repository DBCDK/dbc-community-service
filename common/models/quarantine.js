

module.exports = function(Quarantine) {
  Quarantine.checkIfProfileIsQuarantined = function(ctx, id, next) {
    Quarantine.find({
      where: {
        quarantinedProfileId: id,
        end: {gte: (new Date())}
      }
    }, function (err, res) {
      next(null, {
        quarantined: (res.length > 0)
      });
    });
  };

  Quarantine.remoteMethod(
    'checkIfProfileIsQuarantined',
    {
      description: 'Check if a profile is quarantined',
      accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'id', type: 'number', required: true}
      ],
      returns: {
        arg: 'quarantine', type: 'object', root: true
      },
      http: {path: '/:id/check-if-profile-is-quarantined', verb: 'get'}
    }
  );
};
