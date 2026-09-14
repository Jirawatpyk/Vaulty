-- Atomic document numbers. Read-then-insert on billing_document.doc_no can
-- collide when two activations commit in the same second; unique(doc_no)
-- would then fail the second payment instead of issuing the next number.

create table if not exists billing_doc_seq (
  prefix text primary key,
  last_n integer not null
);

insert into billing_doc_seq (prefix, last_n)
select left(doc_no, 11),
       max(cast(right(doc_no, 5) as integer))
from billing_document
where length(doc_no) = 16
  and left(doc_no, 3) = 'VT-'
group by left(doc_no, 11)
on conflict (prefix) do update
set last_n = greatest(billing_doc_seq.last_n, excluded.last_n);
