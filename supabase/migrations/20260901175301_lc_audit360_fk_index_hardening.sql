-- LC audit 360: cover foreign keys used by growth, commerce, affiliates and reviews.
create index if not exists affiliate_commissions_buyer_user_id_idx
  on nexora.affiliate_commissions (buyer_user_id);
create index if not exists affiliate_commissions_origin_payout_request_id_idx
  on nexora.affiliate_commissions (origin_payout_request_id);
create index if not exists affiliate_commissions_product_id_idx
  on nexora.affiliate_commissions (product_id);
create index if not exists affiliate_payout_requests_reviewed_by_idx
  on nexora.affiliate_payout_requests (reviewed_by);
create index if not exists commerce_product_courses_course_id_idx
  on nexora.commerce_product_courses (course_id);
create index if not exists course_entitlements_order_id_idx
  on nexora.course_entitlements (order_id);
create index if not exists course_entitlements_product_id_idx
  on nexora.course_entitlements (product_id);
create index if not exists course_reviews_course_id_idx
  on nexora.course_reviews (course_id);
