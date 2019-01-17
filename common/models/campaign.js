module.exports = function(Campaign) {
  function logoValidator(err) {
    const logoKeys = Object.keys(this.logos);

    if (
      !logoKeys.includes('svg') ||
      !logoKeys.includes('small') ||
      !logoKeys.includes('medium') ||
      !logoKeys.includes('large')
    ) {
      err();
    }
  }

  function validateStartEndDates(err) {
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
      err();
    }
  }

  Campaign.validate('logos', logoValidator, {
    message:
      'Logos must define small, medium, large and SVG. The logos must be URLs.'
  });
  Campaign.validate('startDate', validateStartEndDates, {
    message: 'Start date must be earlier than end date!'
  });
  Campaign.validatesInclusionOf('type', {
    in: ['group', 'review'],
    message: 'We only support the following types: group, review'
  });

  Campaign.validatesInclusionOf('requiredContactInfo', {
    in: ['none', 'phone', 'mail', 'phoneAndMail', 'phoneOrMail'],
    message:
      'We only support the following types: phone, mail, phoneAndMail, phoneOrMail'
  });
};
