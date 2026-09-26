"""Exact projections for conditional endpoint sensitivity, not timing rules."""
from fractions import Fraction as F
from affine_constraints import Interval, rational


def project_second(inequalities):
    """Existentially eliminate x from a*x+b*y <= rhs (or < rhs).

    Each input is (a,b,rhs,closed,label), with exact rational conversion.
    The returned Interval includes all y for which at least one real x
    satisfies every constraint. No boundedness/attainment assumption is made.
    """
    lowers, uppers, out = [], [], Interval()
    for a,b,rhs,closed,label in inequalities:
        a,b,rhs=map(rational,(a,b,rhs))
        if a==0:
            out.add_leq(b,rhs,closed,label)
        else:
            (uppers if a>0 else lowers).append((rhs/a,-b/a,closed,label))
    for lc,lm,lclosed,llabel in lowers:
        for uc,um,uclosed,ulabel in uppers:
            out.add_leq(lm-um,uc-lc,lclosed and uclosed,[llabel,ulabel])
    return out


def endpoint_constraints(fajr,isha,R,S,N,k,alpha,beta,physical=True):
    """Return affine (t,z) inequalities for one open envelope piece.

    Perturbed horizons are R+alpha*z and S+beta*z. The source intervals
    are affine coefficient pairs with fixed attainment flags on the piece.
    D=Isha-(S+beta*z) is eliminated first; if physical, enforce 0<D<N'.
    Caller must add the temporal domain and separately evaluate its knots.
    """
    k,alpha,beta=map(rational,(k,alpha,beta))
    if k<=0:raise ValueError('positive factor required')
    R,S,N=[tuple(map(rational,v)) for v in (R,S,N)]
    fl,fu,il,iu=[tuple(map(rational,v)) for v in (fajr['lower'],fajr['upper'],isha['lower'],isha['upper'])]
    lows=[(il[0]-S[0],il[1]-S[1],-beta,isha['lower_closed'],'Isha lower'),
          ((R[0]-fu[0])/k,(R[1]-fu[1])/k,alpha/k,fajr['upper_closed'],'Fajr upper')]
    highs=[(iu[0]-S[0],iu[1]-S[1],-beta,isha['upper_closed'],'Isha upper'),
           ((R[0]-fl[0])/k,(R[1]-fl[1])/k,alpha/k,fajr['lower_closed'],'Fajr lower')]
    if physical:
        lows.append((F(0),F(0),F(0),False,'positive D'))
        highs.append((N[0],N[1],alpha-beta,False,'D below night'))
    return [(lm-um,lz-uz,uc-lc,le and ue,[ll,ul])
            for lc,lm,lz,le,ll in lows for uc,um,uz,ue,ul in highs]


def projected_correction(fajr,isha,R,S,N,k,alpha,beta,lo,hi,closed=False,physical=True):
    lo,hi=rational(lo),rational(hi)
    if lo>hi:raise ValueError('ordered finite temporal domain required')
    inequalities=endpoint_constraints(fajr,isha,R,S,N,k,alpha,beta,physical)
    inequalities.extend([(-1,0,-lo,closed,'temporal lower'),(1,0,hi,closed,'temporal upper')])
    return project_second(inequalities)


def nearest_zero(intervals):
    """Infimum absolute displacement and whether any feasible point attains it."""
    good=[i for i in intervals if i.status=='feasible']
    if not good:return {'status':'empty','absoluteInfimum':None,'attained':False,'signedBoundary':None}
    candidates=[]
    for i in good:
        if i.contains(0):return {'status':'feasible','absoluteInfimum':F(0),'attained':True,'signedBoundary':F(0)}
        if i.lower is not None and i.lower>=0:
            candidates.append((i.lower,i.lower_closed,i.lower))
        elif i.upper is not None and i.upper<=0:
            candidates.append((-i.upper,i.upper_closed,i.upper))
        else:raise AssertionError('A nonempty interval crossing zero must contain zero')
    distance=min(d for d,_,_ in candidates)
    best=[x for x in candidates if x[0]==distance]
    chosen=next((x for x in best if x[1]),best[0])
    return {'status':'feasible','absoluteInfimum':distance,'attained':any(x[1] for x in best),'signedBoundary':chosen[2]}
