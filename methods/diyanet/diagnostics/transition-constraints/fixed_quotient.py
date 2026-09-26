"""Fixed-quotient counterpart to the relaxed endpoint sensitivity diagnostic."""
from affine_constraints import rational
from perturbations import project_second


def projected_fixed_quotient(fajr,isha,R,S,N,q,k,alpha,beta,lo,hi,closed=False):
    q,k,alpha,beta,lo,hi=map(rational,(q,k,alpha,beta,lo,hi))
    if not 0<q<1 or k<=0 or lo>hi:raise ValueError('physical quotient, positive factor and ordered domain required')
    R,S,N=[tuple(map(rational,v)) for v in (R,S,N)]
    rows=[(-1,0,-lo,closed,'temporal lower'),(1,0,hi,closed,'temporal upper'),
          (-N[1],-(alpha-beta),N[0],False,'positive perturbed night')]
    for name,b,base,coefficient in [
        ('Fajr',fajr,(R[0]-q*N[0]*k,R[1]-q*N[1]*k),alpha-q*k*(alpha-beta)),
        ('Isha',isha,(S[0]+q*N[0],S[1]+q*N[1]),beta+q*(alpha-beta))]:
        lower,upper=[tuple(map(rational,v)) for v in (b['lower'],b['upper'])]
        rows.extend([(lower[1]-base[1],-coefficient,base[0]-lower[0],b['lower_closed'],name+' lower'),
                     (base[1]-upper[1],coefficient,upper[0]-base[0],b['upper_closed'],name+' upper')])
    return project_second(rows)
